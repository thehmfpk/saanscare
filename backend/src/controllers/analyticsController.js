const { AQIReading, Vehicle, RoadTracking, Device } = require("../models");
const { maintenanceStatus } = require("../utils/vehicleMaintenance");

// GET /api/analytics/gov — city-wide overview for the gov dashboard
exports.govOverview = async (req, res) => {
  const totalDevices = await Device.count();
  const activeDevices = await Device.count({ where: { status: "active" } });
  const totalRoadsTracked = await RoadTracking.count();

  const districts = await AQIReading.findAll({
    attributes: ["district"],
    group: ["district"],
    raw: true,
  });

  const districtStats = [];
  for (const { district } of districts) {
    const readings = await AQIReading.findAll({ where: { district }, raw: true, limit: 365 * 3 });
    if (!readings.length) continue;
    const avgAqi = Math.round(readings.reduce((s, r) => s + r.aqi, 0) / readings.length);
    const latest = readings.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))[0];
    districtStats.push({ district, avgAqi, latestAqi: latest.aqi, latestAt: latest.recordedAt });
  }

  res.json({
    totalDevices,
    activeDevices,
    totalRoadsTracked,
    districtStats: districtStats.sort((a, b) => b.avgAqi - a.avgAqi),
  });
};

// GET /api/analytics/user — personal overview for the user dashboard
exports.userOverview = async (req, res) => {
  const vehicles = await Vehicle.findAll({ where: { userId: req.user.id }, raw: true });
  const avgEmission = vehicles.length
    ? Math.round(vehicles.reduce((s, v) => s + v.emissionEstimate, 0) / vehicles.length)
    : 0;

  res.json({
    vehicleCount: vehicles.length,
    avgEmissionEstimate: avgEmission,
    vehicles: vehicles.map((v) => ({ ...v, maintenance: maintenanceStatus(v) })),
  });
};
