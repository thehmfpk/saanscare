import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { aqiColor } from "./ui";

const LAHORE_CENTER = [31.5497, 74.3436];

export default function MapView({ devices = [], cameras = [], nearby = [], height = "420px" }) {
  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-border">
      <MapContainer center={LAHORE_CENTER} zoom={11} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {devices.map((d) => (
          <CircleMarker
            key={`dev-${d.id}`}
            center={[d.latitude, d.longitude]}
            radius={8}
            pathOptions={{ color: d.status === "active" ? "#2FD8C4" : "#8B96AC", fillOpacity: 0.6 }}
          >
            <Popup>
              <strong>{d.name}</strong>
              <br />
              {d.type} · {d.district}
              <br />
              Status: {d.status}
            </Popup>
          </CircleMarker>
        ))}
        {cameras.map((c) => (
          <CircleMarker
            key={`cam-${c.id}`}
            center={[c.latitude, c.longitude]}
            radius={6}
            pathOptions={{ color: c.status === "online" ? "#FDE047" : "#8B96AC", fillOpacity: 0.5 }}
          >
            <Popup>
              <strong>{c.name}</strong> (Safe City Camera)
              <br />
              {c.area} · {c.status}
            </Popup>
          </CircleMarker>
        ))}
        {nearby.map((n) => (
          <CircleMarker
            key={`nb-${n.id}`}
            center={[n.latitude, n.longitude]}
            radius={7}
            pathOptions={{ color: aqiColor(n.currentAqi), fillOpacity: 0.7 }}
          >
            <Popup>
              <strong>{n.name}</strong> ({n.type})
              <br />
              {n.district} · AQI {n.currentAqi}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
