import { useEffect, useState } from "react";
import api from "../api/axiosClient";
import { Modal, AqiPill, Button, Select } from "./ui";

const STATUS_OPTIONS = ["active", "inactive", "maintenance"];

export default function DeviceDetailModal({ device, onClose, onUpdated }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(device.status);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/devices/${device.id}`).then((r) => setData(r.data));
  }, [device.id]);

  async function saveStatus() {
    setSaving(true);
    try {
      const res = await api.put(`/devices/${device.id}`, { status });
      onUpdated?.(res.data.device || res.data);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Device — ${device.deviceCode}`} onClose={onClose} wide>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="text-lg font-display text-slate-100">{device.name}</div>
          <div className="text-xs text-muted font-mono">{device.type} · {device.district}</div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Button onClick={saveStatus} disabled={saving || status === device.status} className="text-xs">
            {saving ? "Saving…" : "Update"}
          </Button>
        </div>
      </div>

      {!data ? (
        <p className="text-sm text-muted font-mono">Loading activity…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <MiniStat label="Uptime" value={`${data.stats.uptimePct}%`} />
            <MiniStat label="Readings Logged" value={data.stats.readingsLogged} />
            <MiniStat
              label="Last Reported"
              value={data.stats.lastReportedAt ? new Date(data.stats.lastReportedAt).toLocaleDateString() : "—"}
            />
          </div>

          <div className="text-xs uppercase tracking-wide text-muted font-mono mb-2">Recent Activity</div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {data.activity.map((a) => (
              <div key={a.id} className="flex items-center justify-between border border-border rounded-xl px-3 py-2 text-sm">
                <span className="text-muted font-mono text-xs">{new Date(a.recordedAt).toLocaleString()}</span>
                <span className="text-xs text-muted">PM2.5 {a.pm25} · PM10 {a.pm10}</span>
                <AqiPill aqi={a.aqi} />
              </div>
            ))}
            {!data.activity.length && <p className="text-sm text-muted">No activity recorded yet for this district.</p>}
          </div>
        </>
      )}
    </Modal>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-ink/40 border border-border px-3 py-2">
      <div className="text-[10px] text-muted uppercase tracking-wide font-mono">{label}</div>
      <div className="text-lg font-display text-slate-100">{value}</div>
    </div>
  );
}
