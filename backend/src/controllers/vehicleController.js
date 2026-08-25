const { Vehicle, User } = require("../models");
const { maintenanceStatus } = require("../utils/vehicleMaintenance");
const { isValidCnic } = require("../utils/validators");

function serialize(v) {
  const plain = v.toJSON ? v.toJSON() : v;
  return { ...plain, maintenance: maintenanceStatus(plain) };
}

exports.listMine = async (req, res) => {
  const vehicles = await Vehicle.findAll({ where: { userId: req.user.id } });
  res.json({ vehicles: vehicles.map(serialize) });
};

exports.create = async (req, res) => {
  try {
    const {
      plateNumber, type, fuelType, manufactureYear, lastServiceDate, videoUrl,
      ownerCnic, ownerContact, fatherName, fatherContact, fatherCnic,
    } = req.body;

    if (!ownerCnic || !ownerContact || !fatherContact) {
      return res.status(400).json({ error: "ownerCnic, ownerContact, and fatherContact are required" });
    }
    if (!isValidCnic(ownerCnic)) {
      return res.status(400).json({ error: "ownerCnic must be in the format 35202-1234567-1" });
    }
    if (fatherCnic && !isValidCnic(fatherCnic)) {
      return res.status(400).json({ error: "fatherCnic must be in the format 35202-1234567-1" });
    }

    // simple deterministic emission estimate for the demo
    const fuelFactor = { petrol: 40, diesel: 60, cng: 25, hybrid: 15, electric: 2 };
    const age = manufactureYear ? Math.max(0, new Date().getFullYear() - manufactureYear) : 5;
    const emissionEstimate = Math.min(100, (fuelFactor[fuelType] || 40) + age * 1.5);

    const vehicle = await Vehicle.create({
      plateNumber, type, fuelType, manufactureYear, emissionEstimate, lastServiceDate: lastServiceDate || null,
      videoUrl: videoUrl || null,
      ownerCnic, ownerContact, fatherName: fatherName || null, fatherContact, fatherCnic: fatherCnic || null,
      userId: req.user.id,
    });
    res.status(201).json({ vehicle: serialize(vehicle) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const vehicle = await Vehicle.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
  await vehicle.destroy();
  res.json({ success: true });
};

// Gov: see all registered vehicles city-wide, flagged by maintenance urgency
exports.listAll = async (req, res) => {
  const vehicles = await Vehicle.findAll({
    include: [{ model: User, attributes: ["name", "district", "email"] }],
    order: [["createdAt", "DESC"]],
  });
  const serialized = vehicles.map(serialize);
  serialized.sort((a, b) => (b.maintenance.needsMaintenance - a.maintenance.needsMaintenance) || b.emissionEstimate - a.emissionEstimate);
  res.json({ vehicles: serialized });
};
