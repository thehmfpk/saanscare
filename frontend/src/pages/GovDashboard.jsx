import { useEffect, useState, useCallback } from "react";
import api from "../api/axiosClient";
import Layout from "../components/Layout";
import MapView from "../components/MapView";
import TrendChart from "../components/TrendChart";
import ForecastCard from "../components/ForecastCard";
import DeviceDetailModal from "../components/DeviceDetailModal";
import CameraDetailModal from "../components/CameraDetailModal";
import VehicleDetailModal from "../components/VehicleDetailModal";
import RoadHistoryModal from "../components/RoadHistoryModal";
import { useAutoRefresh, LiveBadge } from "../hooks/useAutoRefresh";
import DistrictBarChart from "../components/DistrictBarChart";
import StatusDoughnut from "../components/StatusDoughnut";
import { generateGovReport } from "../utils/pdfReport";
import { FileDown } from "lucide-react";
import { Card, StatCard, AqiPill, Button, Input, Select } from "../components/ui";

const TABS = ["Overview", "Devices", "Map Tracking", "Safe City Cameras", "Road Tracking", "Vehicles"];

export default function GovDashboard() {
  const [tab, setTab] = useState("Overview");
  const [overview, setOverview] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [trend, setTrend] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  const [devices, setDevices] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [roads, setRoads] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [activeDevice, setActiveDevice] = useState(null);
  const [activeCamera, setActiveCamera] = useState(null);
  const [activeVehicle, setActiveVehicle] = useState(null);

  function refreshDevices() { api.get("/devices").then((r) => setDevices(r.data.devices || r.data)); }
  function refreshCameras() { api.get("/cameras").then((r) => setCameras(r.data.cameras || r.data)); }
  function refreshRoads() { return api.get("/roads").then((r) => setRoads(r.data.roads || r.data)); }
  function refreshVehicles() { api.get("/vehicles").then((r) => setVehicles(r.data.vehicles || r.data)); }

  // Overview numbers (district risk exposure, active device counts) auto-refresh —
  // this is honest client-side polling every 45s, not a push websocket.
  const refreshOverview = useCallback(async () => {
    const r = await api.get("/analytics/gov");
    setOverview(r.data);
  }, []);
  const overviewUpdatedAt = useAutoRefresh(refreshOverview, 45000);

  useEffect(() => {
    api.get("/aqi/districts").then((r) => {
      setDistricts(r.data.districts);
      if (r.data.districts.length) setSelectedDistrict(r.data.districts[0]);
    });
    refreshDevices();
    refreshCameras();
    refreshRoads();
    refreshVehicles();
  }, []);

  useEffect(() => {
    if (!selectedDistrict) return;
    api.get(`/aqi/trend?district=${selectedDistrict}&days=730`).then((r) => setTrend(r.data.trend));
    setForecastLoading(true);
    api
      .get(`/aqi/predict?district=${selectedDistrict}`)
      .then((r) => setForecast(r.data))
      .catch(() => setForecast(null))
      .finally(() => setForecastLoading(false));
  }, [selectedDistrict]);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-gradient">Gov / EPA Dashboard</h1>
        <div className="flex gap-1 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                tab === t
                  ? "border-accent text-accent bg-accent/10 shadow-[0_0_0_1px_var(--color-accent),0_0_14px_var(--color-accent-glow)]"
                  : "border-border text-muted hover:text-slate-200 hover:border-accent/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "Overview" && (
        <OverviewTab
          overview={overview}
          districts={districts}
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
          trend={trend}
          forecast={forecast}
          forecastLoading={forecastLoading}
          devices={devices}
          cameras={cameras}
          overviewUpdatedAt={overviewUpdatedAt}
        />
      )}
      {tab === "Devices" && (
        <DevicesTab devices={devices} setDevices={setDevices} districts={districts} onOpen={setActiveDevice} />
      )}
      {tab === "Map Tracking" && (
        <Card title="City-wide Map Tracking">
          <MapView devices={devices} cameras={cameras} height="560px" />
        </Card>
      )}
      {tab === "Safe City Cameras" && (
        <CamerasTab cameras={cameras} setCameras={setCameras} districts={districts} onOpen={setActiveCamera} />
      )}
      {tab === "Road Tracking" && <RoadsTab roads={roads} setRoads={setRoads} districts={districts} refreshRoads={refreshRoads} />}
      {tab === "Vehicles" && <VehiclesTab vehicles={vehicles} onOpen={setActiveVehicle} />}

      {activeDevice && (
        <DeviceDetailModal
          device={activeDevice}
          onClose={() => setActiveDevice(null)}
          onUpdated={(updated) => {
            setDevices((ds) => ds.map((d) => (d.id === updated.id ? updated : d)));
            setActiveDevice(updated);
          }}
        />
      )}
      {activeCamera && <CameraDetailModal camera={activeCamera} onClose={() => setActiveCamera(null)} />}
      {activeVehicle && <VehicleDetailModal vehicle={activeVehicle} onClose={() => setActiveVehicle(null)} showOwner />}
    </Layout>
  );
}

function OverviewTab({ overview, districts, selectedDistrict, setSelectedDistrict, trend, forecast, forecastLoading, devices, cameras, overviewUpdatedAt }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end"><LiveBadge lastUpdated={overviewUpdatedAt} /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Devices" value={`${overview?.activeDevices ?? "—"}/${overview?.totalDevices ?? "—"}`} />
        <StatCard label="Roads Tracked" value={overview?.totalRoadsTracked ?? "—"} />
        <StatCard
          label="Worst District"
          value={overview?.districtStats?.[0]?.district ?? "—"}
          sub={overview?.districtStats?.[0] ? `Avg AQI ${overview.districtStats[0].avgAqi}` : ""}
          tone="danger"
        />
        <StatCard
          label="Best District"
          value={overview?.districtStats?.at(-1)?.district ?? "—"}
          sub={overview?.districtStats?.at(-1) ? `Avg AQI ${overview.districtStats.at(-1).avgAqi}` : ""}
          tone="good"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="District Risk Exposure (anonymized aggregate)" className="lg:col-span-2">
          <div className="grid gap-2">
            {overview?.districtStats?.map((d) => (
              <div key={d.district} className="flex items-center justify-between border-b border-border/60 last:border-0 py-2">
                <span className="text-sm text-slate-200 font-mono">{d.district}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">latest: {d.latestAqi}</span>
                  <AqiPill aqi={d.avgAqi} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Device Status Breakdown">
          <StatusDoughnut
            labels={["Active", "Inactive", "Maintenance"]}
            values={[
              devices.filter((d) => d.status === "active").length,
              devices.filter((d) => d.status === "inactive").length,
              devices.filter((d) => d.status === "maintenance").length,
            ]}
            colors={["#22C55E", "#8B96AC", "#EAB308"]}
          />
        </Card>
      </div>

      <Card title="AQI by District — Comparison">
        <DistrictBarChart districtStats={overview?.districtStats || []} />
      </Card>

      <Card
        title="District Trend & AI Forecast"
        action={
          <Select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="w-40">
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        }
      >
        <TrendChart trend={trend} />
      </Card>

      <ForecastCard forecast={forecast} loading={forecastLoading} />

      <div className="flex justify-end">
        <Button
          variant="ghost"
          className="text-xs inline-flex items-center gap-2"
          onClick={() => generateGovReport({ district: selectedDistrict, overview, forecast })}
        >
          <FileDown className="w-3.5 h-3.5" /> Download SaansCare Report (PDF)
        </Button>
      </div>

      <Card title="Live Map — Devices & Safe City Cameras">
        <MapView devices={devices} cameras={cameras} />
      </Card>
    </div>
  );
}

function DevicesTab({ devices, setDevices, districts, onOpen }) {
  const [form, setForm] = useState({ deviceCode: "", name: "", type: "AQI Monitor", district: districts[0] || "Lahore", latitude: 31.5497, longitude: 74.3436 });
  const [busy, setBusy] = useState(false);

  async function addDevice(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post("/devices", { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) });
      setDevices((d) => [...d, res.data.device || res.data]);
      setForm((f) => ({ ...f, deviceCode: "", name: "" }));
    } finally {
      setBusy(false);
    }
  }

  async function removeDevice(id, e) {
    e.stopPropagation();
    await api.delete(`/devices/${id}`);
    setDevices((d) => d.filter((x) => x.id !== id));
  }

  const statusDot = { active: "bg-aqi-good", inactive: "bg-muted", maintenance: "bg-aqi-usg" };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card title="Add Monitoring Device" className="lg:col-span-1 h-fit">
        <form onSubmit={addDevice} className="space-y-3">
          <Input placeholder="Device code (e.g. AQI-014)" value={form.deviceCode} onChange={(e) => setForm({ ...form, deviceCode: e.target.value })} required />
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" step="any" placeholder="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
            <Input type="number" step="any" placeholder="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
          </div>
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Adding…" : "Add Device"}</Button>
        </form>
      </Card>

      <Card title={`Devices (${devices.length}) — click a device for activity`} className="lg:col-span-2">
        <div className="grid sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
          {devices.map((d) => (
            <button
              key={d.id}
              onClick={() => onOpen(d)}
              className="hover-lift animate-in text-left rounded-xl border border-border bg-panelhi/40 hover:bg-panelhi px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-mono text-slate-100">{d.deviceCode}</div>
                <span className={`w-2 h-2 rounded-full ${statusDot[d.status] || "bg-muted"}`} />
              </div>
              <div className="text-sm text-slate-200 mt-1">{d.name}</div>
              <div className="text-xs text-muted mt-1">{d.type} · {d.district}</div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] uppercase tracking-wide text-muted font-mono">{d.status}</span>
                <span onClick={(e) => removeDevice(d.id, e)} className="text-[10px] text-aqi-unhealthy hover:underline">Remove</span>
              </div>
            </button>
          ))}
          {!devices.length && <p className="text-sm text-muted col-span-full">No devices yet.</p>}
        </div>
      </Card>
    </div>
  );
}

function CamerasTab({ cameras, setCameras, districts, onOpen }) {
  const [form, setForm] = useState({ name: "", area: districts[0] || "Lahore", streamUrl: "", latitude: 31.5497, longitude: 74.3436 });
  const [busy, setBusy] = useState(false);

  async function addCamera(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post("/cameras", { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) });
      setCameras((c) => [...c, res.data.camera || res.data]);
      setForm((f) => ({ ...f, name: "", streamUrl: "" }));
    } finally {
      setBusy(false);
    }
  }

  async function removeCamera(id, e) {
    e.stopPropagation();
    await api.delete(`/cameras/${id}`);
    setCameras((c) => c.filter((x) => x.id !== id));
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card title="Link Safe City Camera" className="lg:col-span-1 h-fit">
        <form onSubmit={addCamera} className="space-y-3">
          <Input placeholder="Camera name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Input placeholder="Stream URL (rtsp/http)" value={form.streamUrl} onChange={(e) => setForm({ ...form, streamUrl: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" step="any" placeholder="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
            <Input type="number" step="any" placeholder="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
          </div>
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Linking…" : "Link Camera"}</Button>
        </form>
      </Card>

      <Card title={`Camera Links (${cameras.length}) — click to view feed`} className="lg:col-span-2">
        <div className="grid sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
          {cameras.map((c) => (
            <button
              key={c.id}
              onClick={() => onOpen(c)}
              className="hover-lift animate-in text-left rounded-xl border border-border bg-panelhi/40 hover:bg-panelhi px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-mono text-slate-100">{c.name}</div>
                <span className={`w-2 h-2 rounded-full ${c.status === "online" ? "bg-aqi-good animate-pulse" : "bg-muted"}`} />
              </div>
              <div className="text-xs text-muted mt-1">{c.area} · {c.status}</div>
              <div className="flex justify-end mt-3">
                <span onClick={(e) => removeCamera(c.id, e)} className="text-[10px] text-aqi-unhealthy hover:underline">Remove</span>
              </div>
            </button>
          ))}
          {!cameras.length && <p className="text-sm text-muted col-span-full">No cameras linked yet.</p>}
        </div>
      </Card>
    </div>
  );
}

const CONGESTION_COLOR = { low: "text-aqi-good border-aqi-good/40", medium: "text-aqi-moderate border-yellow-500/40", high: "text-aqi-usg border-aqi-usg/40", severe: "text-aqi-unhealthy border-aqi-unhealthy/40" };

function RoadsTab({ roads, setRoads, districts, refreshRoads }) {
  const existingRoadNames = [...new Set(roads.map((r) => r.roadName))].sort();
  const [form, setForm] = useState({
    roadName: existingRoadNames[0] || "__new__",
    newRoadName: "",
    area: "", district: districts[0] || "Lahore", congestionLevel: "medium", pollutionIndex: 50,
  });
  const [busy, setBusy] = useState(false);
  const [sortBy, setSortBy] = useState("pollutionIndex");
  const [historyRoad, setHistoryRoad] = useState(null);

  const isNewRoad = form.roadName === "__new__";

  async function addRoad(e) {
    e.preventDefault();
    const roadName = isNewRoad ? form.newRoadName.trim() : form.roadName;
    if (!roadName) return;
    setBusy(true);
    try {
      await api.post("/roads", {
        roadName,
        area: form.area,
        district: form.district,
        congestionLevel: form.congestionLevel,
        pollutionIndex: Number(form.pollutionIndex),
        recordedAt: new Date().toISOString(),
      });
      await refreshRoads();
      setForm((f) => ({ ...f, newRoadName: "", area: "" }));
    } finally {
      setBusy(false);
    }
  }

  const sorted = [...roads].sort((a, b) =>
    sortBy === "pollutionIndex" ? b.pollutionIndex - a.pollutionIndex : a.roadName.localeCompare(b.roadName)
  );

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card title="Log Road-Segment Reading" className="lg:col-span-1 h-fit">
        <form onSubmit={addRoad} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted font-mono">Road</label>
            <Select value={form.roadName} onChange={(e) => setForm({ ...form, roadName: e.target.value })} className="mt-1">
              {existingRoadNames.map((name) => <option key={name} value={name}>{name}</option>)}
              <option value="__new__">+ Add a new road…</option>
            </Select>
          </div>
          {isNewRoad && (
            <Input placeholder="New road name" value={form.newRoadName} onChange={(e) => setForm({ ...form, newRoadName: e.target.value })} required />
          )}
          <Input placeholder="Area / locality" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} required />
          <Select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Select value={form.congestionLevel} onChange={(e) => setForm({ ...form, congestionLevel: e.target.value })}>
            <option value="low">Low congestion</option>
            <option value="medium">Medium congestion</option>
            <option value="high">High congestion</option>
            <option value="severe">Severe congestion</option>
          </Select>
          <Input type="number" placeholder="Pollution index (0-100)" value={form.pollutionIndex} onChange={(e) => setForm({ ...form, pollutionIndex: e.target.value })} required />
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Logging…" : "Log Reading"}</Button>
          <p className="text-[10px] text-muted">
            Picking an existing road adds a new reading to its history — it won't create a duplicate road card.
          </p>
        </form>
      </Card>

      <Card
        title={`Roads Tracked (${roads.length} unique roads)`}
        className="lg:col-span-2"
        action={
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-40">
            <option value="pollutionIndex">Sort: Worst first</option>
            <option value="roadName">Sort: Name A-Z</option>
          </Select>
        }
      >
        <div className="grid sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
          {sorted.map((r) => (
            <button
              key={r.roadName}
              onClick={() => setHistoryRoad(r.roadName)}
              className={`text-left hover-lift animate-in rounded-xl border px-4 py-3 ${CONGESTION_COLOR[r.congestionLevel] || "border-border"}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-mono text-slate-100">{r.roadName}</div>
                <span className="text-xs font-mono uppercase">{r.congestionLevel}</span>
              </div>
              <div className="text-xs text-muted mt-1">{r.area} · {r.district}</div>
              <div className="mt-2 h-1.5 rounded-full bg-black/30 overflow-hidden">
                <div className="h-full bg-current" style={{ width: `${Math.min(100, r.pollutionIndex)}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted font-mono">latest: {r.pollutionIndex} · avg: {r.avgPollutionIndex}</span>
                <span className="text-[10px] text-muted font-mono">{r.sampleCount} readings</span>
              </div>
            </button>
          ))}
          {!roads.length && <p className="text-sm text-muted col-span-full">No roads logged yet.</p>}
        </div>
      </Card>

      {historyRoad && <RoadHistoryModal roadName={historyRoad} onClose={() => setHistoryRoad(null)} />}
    </div>
  );
}

function VehiclesTab({ vehicles, onOpen }) {
  const flagged = vehicles.filter((v) => v.maintenance?.needsMaintenance);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Registered Vehicles" value={vehicles.length} />
        <StatCard label="Need Maintenance" value={flagged.length} tone={flagged.length ? "warn" : "good"} />
      </div>

      <Card title={`All Registered Vehicles (${vehicles.length}) — click for details & video`}>
        <div className="grid sm:grid-cols-2 gap-3">
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => onOpen(v)}
              className={`w-full text-left hover-lift animate-in rounded-xl border px-4 py-3 ${v.maintenance?.needsMaintenance ? "border-aqi-usg/50 bg-aqi-usg/5" : "border-border"}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-mono text-slate-100">{v.plateNumber}</div>
                {v.maintenance?.needsMaintenance && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-aqi-usg text-aqi-usg">MAINTENANCE DUE</span>
                )}
              </div>
              <div className="text-xs text-muted mt-1">{v.type} · {v.fuelType} · {v.manufactureYear} · emission {v.emissionEstimate}</div>
              {v.videoUrl && (
                <span className="inline-block text-[11px] text-accent mt-1">Video attached — click to view</span>
              )}
              {v.maintenance?.reasons?.length > 0 && (
                <div className="text-[11px] text-aqi-usg/90 mt-1">{v.maintenance.reasons.join(" · ")}</div>
              )}
              <div className="border-t border-border/60 mt-3 pt-2 text-xs space-y-0.5">
                <div className="text-slate-300">Owner: {v.User?.name} <span className="text-muted">({v.User?.district})</span></div>
                <div className="text-muted font-mono">CNIC: {v.ownerCnic} · {v.ownerContact}</div>
                {v.fatherContact && (
                  <div className="text-muted font-mono">Father: {v.fatherName || "—"} · {v.fatherCnic || "—"} · {v.fatherContact}</div>
                )}
              </div>
            </button>
          ))}
          {!vehicles.length && <p className="text-sm text-muted col-span-full">No vehicles registered yet.</p>}
        </div>
      </Card>
    </div>
  );
}
