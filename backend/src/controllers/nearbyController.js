const { NearbyStop } = require("../models");

// GET /api/nearby?district=Lahore — "check nearby market stop": ranks
// nearby markets/rest stops by current AQI so users can pick the cleanest one.
exports.list = async (req, res) => {
  const { district } = req.query;
  const where = district ? { district } : {};
  const stops = await NearbyStop.findAll({ where, order: [["currentAqi", "ASC"]] });
  res.json({ stops });
};
