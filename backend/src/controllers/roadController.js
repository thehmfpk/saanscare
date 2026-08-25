const { RoadTracking } = require("../models");
const { Op } = require("sequelize");

// GET /api/roads — one card per unique road (latest reading + a short rolling trend),
// not a raw dump of every historical tracking row. Add ?history=RoadName for the
// full time series behind a single road if you need to chart it later.
exports.list = async (req, res) => {
  const { district, area } = req.query;
  const where = {};
  if (district) where.district = district;
  if (area) where.area = area;

  const rows = await RoadTracking.findAll({ where, order: [["recordedAt", "DESC"]], limit: 1000 });

  const byRoad = new Map();
  for (const row of rows) {
    const key = row.roadName;
    if (!byRoad.has(key)) {
      byRoad.set(key, { latest: row, samples: [] });
    }
    byRoad.get(key).samples.push(row);
  }

  const roads = Array.from(byRoad.values()).map(({ latest, samples }) => {
    const avgPollutionIndex =
      Math.round((samples.reduce((s, r) => s + r.pollutionIndex, 0) / samples.length) * 10) / 10;
    return {
      id: latest.id,
      roadName: latest.roadName,
      area: latest.area,
      district: latest.district,
      latitude: latest.latitude,
      longitude: latest.longitude,
      congestionLevel: latest.congestionLevel,
      pollutionIndex: latest.pollutionIndex,
      avgPollutionIndex,
      recordedAt: latest.recordedAt,
      sampleCount: samples.length,
    };
  });

  res.json({ roads });
};

// GET /api/roads/history?road=Ferozepur%20Road — full time series for one road
exports.history = async (req, res) => {
  const { road } = req.query;
  if (!road) return res.status(400).json({ error: "road query param is required" });
  const rows = await RoadTracking.findAll({
    where: { roadName: road },
    order: [["recordedAt", "ASC"]],
  });
  res.json({ roadName: road, history: rows });
};

exports.create = async (req, res) => {
  try {
    const road = await RoadTracking.create(req.body);
    res.status(201).json({ road });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
