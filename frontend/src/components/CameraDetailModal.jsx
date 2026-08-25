import { useEffect, useState } from "react";
import api from "../api/axiosClient";
import { Modal } from "./ui";

export default function CameraDetailModal({ camera, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/cameras/${camera.id}`).then((r) => setData(r.data));
  }, [camera.id]);

  const isLive = data?.live?.status === "live";

  return (
    <Modal title={`Camera — ${camera.name}`} onClose={onClose} wide>
      <div className="rounded-xl overflow-hidden border border-border relative aspect-video bg-black mb-3">
        {isLive ? (
          <LiveFeedSim seed={camera.id} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm font-mono">
            Camera offline — no live feed
          </div>
        )}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-md">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-white font-mono tracking-wide">SIMULATED LIVE</span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted font-mono mb-3">{data?.live?.message}</p>

      {camera.referenceVideoUrl && (
        <a
          href={camera.referenceVideoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-mono text-accent border border-accent/40 rounded-lg px-3 py-2 mb-5 hover:bg-accent/10 transition-colors"
        >
          ▶ Watch reference traffic footage (Lahore Traffic Police, official channel)
        </a>
      )}
      <p className="text-[11px] text-muted mb-5 -mt-3">
        Note: PSCA / Safe City's actual camera network is a closed government system with no
        public feed access. The clip above is genuine public footage used for demo purposes only —
        not this specific camera's live feed.
      </p>

      <div className="text-xs uppercase tracking-wide text-muted font-mono mb-2">Recent Recordings</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(data?.clips || []).map((c) => (
          <div key={c.id} className="rounded-lg border border-border overflow-hidden">
            <div
              className="aspect-video"
              style={{ background: `linear-gradient(135deg, hsl(${c.thumbnailSeed} 40% 18%), hsl(${c.thumbnailSeed} 30% 8%))` }}
            />
            <div className="px-2 py-1.5 text-[10px] font-mono text-muted flex justify-between">
              <span>{new Date(c.startedAt).toLocaleTimeString()}</span>
              <span>{c.durationSec}s</span>
            </div>
          </div>
        ))}
        {data && !data.clips.length && <p className="text-sm text-muted col-span-full">No recent recordings — camera offline.</p>}
      </div>
    </Modal>
  );
}

// Lightweight animated placeholder standing in for a real RTSP/VMS embed.
function LiveFeedSim({ seed }) {
  return (
    <div
      className="w-full h-full animate-pulse"
      style={{
        background: `radial-gradient(circle at 30% 30%, hsl(${(seed * 37) % 360} 35% 16%), #05070A 70%)`,
      }}
    >
      <div className="w-full h-full flex items-center justify-center text-[11px] text-muted/70 font-mono">
        simulated feed — connect real stream at streamUrl
      </div>
    </div>
  );
}
