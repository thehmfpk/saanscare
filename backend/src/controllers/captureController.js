const { VehicleCapture } = require("../models");

exports.list = async (req, res) => {
  const { area } = req.query;
  const where = area ? { area } : {};
  const captures = await VehicleCapture.findAll({ where, order: [["capturedAt", "DESC"]], limit: 200 });
  res.json({ captures });
};

exports.create = async (req, res) => {
  try {
    const capture = await VehicleCapture.create(req.body);
    res.status(201).json({ capture });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
