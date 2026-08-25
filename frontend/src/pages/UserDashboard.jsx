import { useEffect, useState, useCallback } from "react";
import api from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import MapView from "../components/MapView";
import TrendChart from "../components/TrendChart";
import ForecastCard from "../components/ForecastCard";
import { useAutoRefresh, LiveBadge } from "../hooks/useAutoRefresh";
import VehicleDetailModal from "../components/VehicleDetailModal";
import StatusDoughnut from "../components/StatusDoughnut";
import { generateUserReport } from "../utils/pdfReport";
import { FileDown } from "lucide-react";
import { Card, StatCard, AqiPill, Button, Input, Select } from "../components/ui";

export default function UserDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [nearby, setNearby] = useState([]);
  const [currentAqi, setCurrentAqi] = useState(null);

  const district = user?.district || "Lahore";

  // Current AQI + nearby-stop AQI auto-refresh every 30s — honest client-side
  // polling against the live AQIReading table, not a push websocket.
  const refreshLive = useCallback(async () => {
    const [cur, nb] = await Promise.all([api.get(`/aqi/current`), api.get("/nearby")]);
    const match = (cur.data.current || []).find((c) => c.district === district);
    setCurrentAqi(match || null);
    setNearby(nb.data.stops || nb.data);
  }, [district]);
  const liveUpdatedAt = useAutoRefresh(refreshLive, 30000);

  useEffect(() => {
    api.get("/analytics/user").then((r) => setOverview(r.data));
    api.get(`/aqi/trend?district=${district}&days=730`).then((r) => setTrend(r.data.trend));
    setForecastLoading(true);
    api
      .get(`/aqi/predict?district=${district}`)
      .then((r) => setForecast(r.data))
      .catch(() => setForecast(null))
      .finally(() => setForecastLoading(false));
  }, [district]);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-gradient">Resident Dashboard — {district}</h1>
        <LiveBadge lastUpdated={liveUpdatedAt} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-border bg-panel/70 p-5 col-span-2">
          <div className="text-xs uppercase tracking-wider text-muted font-mono">Current Air Quality</div>
          <div className="mt-3">
            {currentAqi ? <AqiPill aqi={currentAqi.aqi} /> : <span className="text-muted text-sm">Loading…</span>}
          </div>
          {currentAqi && <div className="text-xs text-muted mt-2">as of {new Date(currentAqi.recordedAt).toLocaleString()}</div>}
        </div>
        <StatCard label="Your Vehicles" value={overview?.vehicleCount ?? "—"} />
        <StatCard
          label="Avg Emission Score"
          value={overview?.avgEmissionEstimate ?? "—"}
          tone={overview?.avgEmissionEstimate > 60 ? "warn" : "good"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title={`${district} — 2-Year AQI Trend`}>
            <TrendChart trend={trend} />
          </Card>
          <ForecastCard forecast={forecast} loading={forecastLoading} />
          <div className="flex justify-end">
            <Button
              variant="ghost"
              className="text-xs inline-flex items-center gap-2"
              onClick={() => generateUserReport({ district, overview, forecast, currentAqi })}
            >
              <FileDown className="w-3.5 h-3.5" /> Download SaansCare Report (PDF)
            </Button>
          </div>
          <Card title="Nearby Markets & Rest Stops">
            <MapView nearby={nearby} height="360px" />
          </Card>
        </div>

        <div className="space-y-6">
          <VehicleManager overview={overview} setOverview={setOverview} />
          <Card title="Nearby Air Quality Mix">
            <StatusDoughnut
              labels={["Good", "Moderate", "Unhealthy (Sensitive)", "Unhealthy", "Very Unhealthy", "Hazardous"]}
              values={[0, 1, 2, 3, 4, 5].map(
                (bucket) =>
                  nearby.filter((n) => {
                    const a = n.currentAqi;
                    if (bucket === 0) return a <= 50;
                    if (bucket === 1) return a > 50 && a <= 100;
                    if (bucket === 2) return a > 100 && a <= 150;
                    if (bucket === 3) return a > 150 && a <= 200;
                    if (bucket === 4) return a > 200 && a <= 300;
                    return a > 300;
                  }).length
              )}
              colors={["#4ADE80", "#FDE047", "#FB923C", "#F87171", "#C084FC", "#991B1B"]}
            />
          </Card>
          <NearbyList nearby={nearby} />
        </div>
      </div>
    </Layout>
  );
}

function VehicleManager({ overview, setOverview }) {
  const [form, setForm] = useState({
    plateNumber: "", type: "car", fuelType: "petrol", manufactureYear: 2020, lastServiceDate: "", videoUrl: "",
    ownerCnic: "", ownerContact: "", fatherName: "", fatherContact: "", fatherCnic: "",
  });
  const [busy, setBusy] = useState(false);
  const [viewingVehicle, setViewingVehicle] = useState(null);
  const [error, setError] = useState("");

  async function addVehicle(e) {
    e.preventDefault();
    setError("");

    const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicPattern.test(form.ownerCnic.trim())) {
      setError("Owner CNIC must be in the format 35202-1234567-1");
      return;
    }
    if (form.fatherCnic && !cnicPattern.test(form.fatherCnic.trim())) {
      setError("Father's CNIC must be in the format 35202-1234567-1");
      return;
    }

    setBusy(true);
    try {
      const res = await api.post("/vehicles", { ...form, manufactureYear: Number(form.manufactureYear) });
      const vehicle = res.data.vehicle || res.data;
      setOverview((o) => ({
        ...o,
        vehicleCount: (o?.vehicleCount || 0) + 1,
        vehicles: [...(o?.vehicles || []), vehicle],
      }));
      setForm((f) => ({ ...f, plateNumber: "", lastServiceDate: "" }));
    } catch (err) {
      setError(err.response?.data?.error || "Could not add vehicle");
    } finally {
      setBusy(false);
    }
  }

  async function removeVehicle(id) {
    await api.delete(`/vehicles/${id}`);
    setOverview((o) => ({
      ...o,
      vehicleCount: Math.max(0, (o?.vehicleCount || 1) - 1),
      vehicles: (o?.vehicles || []).filter((v) => v.id !== id),
    }));
  }

  return (
    <Card title="Add Your Vehicle">
      <form onSubmit={addVehicle} className="space-y-3">
        <Input placeholder="Plate number" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {["car", "bike", "rickshaw", "truck", "van", "bus"].map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
            {["petrol", "diesel", "cng", "electric", "hybrid"].map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input type="number" placeholder="Manufacture year" value={form.manufactureYear} onChange={(e) => setForm({ ...form, manufactureYear: e.target.value })} />
          <Input type="date" placeholder="Last service date" value={form.lastServiceDate} onChange={(e) => setForm({ ...form, lastServiceDate: e.target.value })} />
        </div>
        <Input placeholder="Vehicle video link (optional — dashcam/condition video)" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />

        <div className="pt-2 border-t border-border/60">
          <div className="text-[11px] uppercase tracking-wide text-muted font-mono mb-2 mt-2">Owner Details (required)</div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Owner CNIC — 35202-1234567-1" value={form.ownerCnic} onChange={(e) => setForm({ ...form, ownerCnic: e.target.value })} required />
            <Input placeholder="Owner contact number" value={form.ownerContact} onChange={(e) => setForm({ ...form, ownerContact: e.target.value })} required />
          </div>
        </div>

        <div className="pt-2 border-t border-border/60">
          <div className="text-[11px] uppercase tracking-wide text-muted font-mono mb-2 mt-2">Father's Details</div>
          <Input placeholder="Father's name" value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} className="mb-3" />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Father's contact number" value={form.fatherContact} onChange={(e) => setForm({ ...form, fatherContact: e.target.value })} required />
            <Input placeholder="Father's CNIC — 35202-1234567-1 (optional)" value={form.fatherCnic} onChange={(e) => setForm({ ...form, fatherCnic: e.target.value })} />
          </div>
        </div>

        {error && <p className="text-xs text-aqi-unhealthy font-mono">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Adding…" : "Add Vehicle"}</Button>
      </form>

      <div className="mt-4 space-y-2">
        {(overview?.vehicles || []).map((v) => (
          <div key={v.id} className={`rounded-xl border px-3 py-2 ${v.maintenance?.needsMaintenance ? "border-aqi-usg/50 bg-aqi-usg/5" : "border-border"}`}>
            <div className="flex items-center justify-between">
              <button onClick={() => setViewingVehicle(v)} className="text-xs font-mono text-slate-200 hover:text-accent text-left">
                {v.plateNumber} · {v.type} · {v.fuelType}
              </button>
              <Button variant="danger" onClick={() => removeVehicle(v.id)} className="text-xs px-2 py-1">✕</Button>
            </div>
            {v.videoUrl && (
              <button onClick={() => setViewingVehicle(v)} className="text-[10px] text-accent hover:underline mt-1 block">
                Video attached — click to view
              </button>
            )}
            {v.maintenance?.needsMaintenance && (
              <div className="text-[10px] text-aqi-usg mt-1">⚠ Maintenance due: {v.maintenance.reasons.join(" · ")}</div>
            )}
          </div>
        ))}
      </div>
      {viewingVehicle && <VehicleDetailModal vehicle={viewingVehicle} onClose={() => setViewingVehicle(null)} />}
    </Card>
  );
}

function NearbyList({ nearby }) {
  return (
    <Card title="Check Nearby Stops">
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {nearby.map((n) => (
          <div key={n.id} className="flex items-center justify-between border border-border rounded-xl px-3 py-2">
            <div>
              <div className="text-xs font-mono text-slate-200">{n.name}</div>
              <div className="text-[10px] text-muted uppercase">{n.type} · {n.district}</div>
            </div>
            <AqiPill aqi={n.currentAqi} />
          </div>
        ))}
        {!nearby.length && <p className="text-sm text-muted">No nearby stops yet.</p>}
      </div>
    </Card>
  );
}
