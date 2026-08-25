import { useEffect, useState } from "react";
import api from "../api/axiosClient";
import { Modal } from "./ui";

const CONGESTION_DOT = { low: "bg-aqi-good", medium: "bg-aqi-moderate", high: "bg-aqi-usg", severe: "bg-aqi-unhealthy" };

export default function RoadHistoryModal({ roadName, onClose }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    api.get(`/roads/history?road=${encodeURIComponent(roadName)}`).then((r) => setHistory(r.data.history));
  }, [roadName]);

  return (
    <Modal title={`Road Tracking History — ${roadName}`} onClose={onClose} wide>
      {!history ? (
        <p className="text-sm text-muted font-mono">Loading history…</p>
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {[...history].reverse().map((h) => (
            <div key={h.id} className="flex items-center justify-between border border-border rounded-xl px-3 py-2 text-sm">
              <span className="text-muted font-mono text-xs">{new Date(h.recordedAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${CONGESTION_DOT[h.congestionLevel] || "bg-muted"}`} />
                {h.congestionLevel}
              </span>
              <span className="text-xs font-mono text-slate-300">pollution idx: {h.pollutionIndex}</span>
            </div>
          ))}
          {!history.length && <p className="text-sm text-muted">No history recorded.</p>}
        </div>
      )}
    </Modal>
  );
}
