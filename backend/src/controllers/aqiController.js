const { Op, fn, col, literal } = require("sequelize");
const { AQIReading, Prediction } = require("../models");
const { generateForecast } = require("../services/groqService");

// GET /api/aqi/districts — list of districts we have data for
exports.listDistricts = async (req, res) => {
  const rows = await AQIReading.findAll({
    attributes: [[fn("DISTINCT", col("district")), "district"]],
    raw: true,
  });
  res.json({ districts: rows.map((r) => r.district) });
};

// GET /api/aqi/history?district=Lahore&start=...&end=...
exports.getHistory = async (req, res) => {
  const { district, start, end, limit } = req.query;
  const where = {};
  if (district) where.district = district;
  if (start || end) {
    where.recordedAt = {};
    if (start) where.recordedAt[Op.gte] = new Date(start);
    if (end) where.recordedAt[Op.lte] = new Date(end);
  }
  const rows = await AQIReading.findAll({
    where,
    order: [["recordedAt", "ASC"]],
    limit: limit ? parseInt(limit, 10) : 2000,
  });
  res.json({ count: rows.length, readings: rows });
};

// GET /api/aqi/trend?district=Lahore&granularity=month
// Aggregated series for charting (Chart.js friendly: [{label, avgAqi}])
exports.getTrend = async (req, res) => {
  const { district } = req.query;
  const where = district ? { district } : {};
  const rows = await AQIReading.findAll({ where, raw: true, order: [["recordedAt", "ASC"]] });

  // Aggregate by YYYY-MM in JS — avoids dialect-specific date functions so this
  // works identically whether DB_DIALECT is sqlite or mysql.
  const buckets = {};
  for (const r of rows) {
    const d = new Date(r.recordedAt);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!buckets[label]) buckets[label] = [];
    buckets[label].push(r.aqi);
  }

  const trend = Object.keys(buckets)
    .sort()
    .map((label) => {
      const vals = buckets[label];
      return {
        label,
        avgAqi: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
        maxAqi: Math.max(...vals),
        minAqi: Math.min(...vals),
      };
    });

  res.json({ trend });
};

// GET /api/aqi/current — latest reading per district (for map + gov overview)
exports.getCurrentByDistrict = async (req, res) => {
  const districts = await AQIReading.findAll({
    attributes: [[fn("DISTINCT", col("district")), "district"]],
    raw: true,
  });

  const results = [];
  for (const { district } of districts) {
    const latest = await AQIReading.findOne({
      where: { district },
      order: [["recordedAt", "DESC"]],
    });
    if (latest) results.push(latest);
  }
  res.json({ current: results });
};

async function computeStats(district) {
  const readings = await AQIReading.findAll({ where: { district }, raw: true });
  if (readings.length === 0) return null;

  const avgAqi = Math.round(readings.reduce((s, r) => s + r.aqi, 0) / readings.length);
  const maxAqi = Math.max(...readings.map((r) => r.aqi));

  const winter = readings.filter((r) => {
    const m = new Date(r.recordedAt).getMonth(); // 0=Jan
    return m <= 1 || m >= 10; // Nov, Dec, Jan, Feb
  });
  const summer = readings.filter((r) => {
    const m = new Date(r.recordedAt).getMonth();
    return m >= 4 && m <= 7; // May-Aug
  });
  const winterAvg = winter.length
    ? Math.round(winter.reduce((s, r) => s + r.aqi, 0) / winter.length)
    : avgAqi;
  const summerAvg = summer.length
    ? Math.round(summer.reduce((s, r) => s + r.aqi, 0) / summer.length)
    : avgAqi;

  // naive year-over-year trend: compare most recent 90 days avg vs the 90 days one year before that
  const sorted = [...readings].sort(
    (a, b) => new Date(a.recordedAt) - new Date(b.recordedAt)
  );
  const last = sorted[sorted.length - 1];
  const lastDate = new Date(last.recordedAt);
  const recentWindowStart = new Date(lastDate);
  recentWindowStart.setDate(recentWindowStart.getDate() - 90);
  const priorWindowEnd = new Date(recentWindowStart);
  priorWindowEnd.setFullYear(priorWindowEnd.getFullYear() - 1);
  const priorWindowStart = new Date(priorWindowEnd);
  priorWindowStart.setDate(priorWindowStart.getDate() - 90);

  const recentSet = sorted.filter(
    (r) => new Date(r.recordedAt) >= recentWindowStart && new Date(r.recordedAt) <= lastDate
  );
  const priorSet = sorted.filter(
    (r) => new Date(r.recordedAt) >= priorWindowStart && new Date(r.recordedAt) <= priorWindowEnd
  );

  const recentAvg = recentSet.length
    ? recentSet.reduce((s, r) => s + r.aqi, 0) / recentSet.length
    : avgAqi;
  const priorAvg = priorSet.length
    ? priorSet.reduce((s, r) => s + r.aqi, 0) / priorSet.length
    : recentAvg;

  const trendPctVsLastYear = priorAvg
    ? Math.round(((recentAvg - priorAvg) / priorAvg) * 100)
    : 0;

  return { avgAqi, maxAqi, winterAvg, summerAvg, trendPctVsLastYear, sampleSize: readings.length };
}

// GET /api/aqi/predict?district=Lahore&refresh=true — 12-month narrative forecast (Groq or fallback)
exports.predict = async (req, res) => {
  try {
    const district = req.query.district || "Lahore";
    const forceRefresh = req.query.refresh === "true";

    // Reuse a cached prediction — but ONLY if it was a real Groq-generated one.
    // A cached "fallback" result is deliberately given a short TTL so that adding
    // your GROQ_API_KEY takes effect on the next request instead of being stuck
    // behind a stale 24h cache entry.
    if (!forceRefresh) {
      const cached = await Prediction.findOne({
        where: { district, periodLabel: "Next 12 Months" },
        order: [["createdAt", "DESC"]],
      });
      if (cached) {
        const ageMs = Date.now() - new Date(cached.createdAt).getTime();
        const ttl = cached.generatedBy === "groq" ? 24 * 60 * 60 * 1000 : 60 * 1000; // 1 min for fallback
        if (ageMs < ttl) {
          return res.json({
            district,
            narrative: cached.narrative,
            riskLevel: cached.riskLevel,
            generatedBy: cached.generatedBy,
            cached: true,
            stats: JSON.parse(cached.statsSnapshot || "{}"),
          });
        }
      }
    }

    const stats = await computeStats(district);
    if (!stats) return res.status(404).json({ error: `No AQI history for ${district} yet` });

    const { narrative, riskLevel, generatedBy, fallbackReason } = await generateForecast(district, stats);

    await Prediction.create({
      district,
      periodLabel: "Next 12 Months",
      narrative,
      riskLevel,
      generatedBy,
      statsSnapshot: JSON.stringify(stats),
    });

    res.json({ district, narrative, riskLevel, generatedBy, fallbackReason, cached: false, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
