import { Modal, AqiPill } from "./ui";
import { toEmbedUrl, isDirectVideoFile } from "../utils/video";

export default function VehicleDetailModal({ vehicle, onClose, showOwner = false }) {
  const embedUrl = toEmbedUrl(vehicle.videoUrl);
  const isDirectFile = isDirectVideoFile(vehicle.videoUrl);

  return (
    <Modal title={`Vehicle — ${vehicle.plateNumber}`} onClose={onClose} wide>
      {vehicle.videoUrl ? (
        <div className="rounded-xl overflow-hidden border border-border bg-black aspect-video mb-4">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`${vehicle.plateNumber} video`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : isDirectFile ? (
            <video src={vehicle.videoUrl} controls className="w-full h-full" />
          ) : (
            <a
              href={vehicle.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-full flex items-center justify-center text-accent text-sm font-mono hover:underline"
            >
              Open attached vehicle video ↗
            </a>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border aspect-video mb-4 flex items-center justify-center text-muted text-sm font-mono">
          No video attached for this vehicle
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label="Type" value={vehicle.type} />
        <Field label="Fuel" value={vehicle.fuelType} />
        <Field label="Manufacture Year" value={vehicle.manufactureYear} />
        <Field label="Emission Estimate" value={vehicle.emissionEstimate} />
        <Field label="Last Service" value={vehicle.lastServiceDate || "Not on record"} />
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted font-mono mb-1">Status</div>
          {vehicle.maintenance?.needsMaintenance ? (
            <span className="text-xs font-mono px-2 py-1 rounded-md border border-aqi-usg text-aqi-usg">MAINTENANCE DUE</span>
          ) : (
            <span className="text-xs font-mono px-2 py-1 rounded-md border border-aqi-good text-aqi-good">OK</span>
          )}
        </div>
      </div>

      {vehicle.maintenance?.reasons?.length > 0 && (
        <div className="text-xs text-aqi-usg/90 mb-4">Reasons: {vehicle.maintenance.reasons.join(" · ")}</div>
      )}

      {showOwner && (
        <div className="border-t border-border pt-3 text-xs space-y-1">
          <div className="text-slate-300">Owner: {vehicle.User?.name} <span className="text-muted">({vehicle.User?.district})</span></div>
          <div className="text-muted font-mono">CNIC: {vehicle.ownerCnic} · {vehicle.ownerContact}</div>
          {vehicle.fatherContact && (
            <div className="text-muted font-mono">Father: {vehicle.fatherName || "—"} · {vehicle.fatherCnic || "—"} · {vehicle.fatherContact}</div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted font-mono mb-1">{label}</div>
      <div className="text-sm text-slate-200">{value ?? "—"}</div>
    </div>
  );
}
