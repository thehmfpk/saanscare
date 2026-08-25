const { Device, AQIReading } = require("../models");
const { Op } = require("sequelize");

exports.list = async (req, res) => {
  const devices = await Device.findAll({ order: [["createdAt", "DESC"]] });
  res.json({ devices });
};

exports.create = async (req, res) => {
  try {
    const { deviceCode, name, type, district, latitude, longitude } = req.body;
    const device = await Device.create({
      deviceCode, name, type, district, latitude, longitude, addedBy: req.user.id,
    });
    res.status(201).json({ device });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const device = await Device.findByPk(req.params.id);
  if (!device) return res.status(404).json({ error: "Device not found" });
  await device.update(req.body);
  res.json({ device });
};

// Click-through detail: device metadata + its district's recent AQI activity feed,
// standing in for real per-device telemetry (uptime, last-ping, raw sensor log) until
// actual hardware is wired up — same shape either way.
exports.getOne = async (req, res) => {
  const device = await Device.findByPk(req.params.id);
  if (!device) return res.status(404).json({ error: "Device not found" });

  const readings = await AQIReading.findAll({
    where: { district: device.district },
    order: [["recordedAt", "DESC"]],
    limit: 30,
  });

  const uptimePct = device.status === "active" ? 97 + Math.round(Math.random() * 3) : device.status === "maintenance" ? 60 : 0;

  res.json({
    device,
    activity: readings.map((r) => ({
      id: r.id,
      recordedAt: r.recordedAt,
      aqi: r.aqi,
      pm25: r.pm25,
      pm10: r.pm10,
      category: r.category,
    })),
    stats: {
      uptimePct,
      lastReportedAt: readings[0]?.recordedAt || null,
      readingsLogged: readings.length,
    },
  });
};

exports.remove = async (req, res) => {
  const device = await Device.findByPk(req.params.id);
  if (!device) return res.status(404).json({ error: "Device not found" });
  await device.destroy();
  res.json({ success: true });
};
