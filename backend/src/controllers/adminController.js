const {
  User, Device, CameraLink, RoadTracking, Vehicle, VehicleCapture, NearbyStop, Prediction,
} = require("../models");
const bcrypt = require("bcryptjs");
const { maintenanceStatus } = require("../utils/vehicleMaintenance");
const { isValidEmail } = require("../utils/validators");

// POST /api/admin/gov — admin directly provisions a Gov/EPA official account.
// This is the only way a gov account gets created — writes straight to the database,
// no public registration path involved.
exports.addGovOfficial = async (req, res) => {
  try {
    const { name, email, password, district } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, password are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const gov = await User.create({
      name,
      email: email.trim().toLowerCase(),
      password: hashed,
      role: "gov",
      district: district || "Lahore",
    });

    res.status(201).json({
      user: { id: gov.id, name: gov.name, email: gov.email, role: gov.role, district: gov.district, createdAt: gov.createdAt },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/admin/users/:id — edit name/email/district, and role (user <-> gov only;
// never promotes to/edits admin accounts through this endpoint).
exports.updateUser = async (req, res) => {
  const target = await User.findByPk(req.params.id);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.role === "admin") return res.status(403).json({ error: "Admin accounts can't be edited here" });

  const { name, email, district, role } = req.body;

  if (email && email.trim().toLowerCase() !== target.email) {
    if (!isValidEmail(email)) return res.status(400).json({ error: "Please enter a valid email address" });
    const clash = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (clash) return res.status(409).json({ error: "Email already in use" });
    target.email = email.trim().toLowerCase();
  }
  if (name) target.name = name;
  if (district) target.district = district;
  if (role && ["user", "gov"].includes(role)) target.role = role;

  await target.save();
  res.json({ user: { id: target.id, name: target.name, email: target.email, role: target.role, district: target.district } });
};

// DELETE /api/admin/users/:id — removes a gov or resident account (and their vehicles,
// via cascade). Admin accounts and self-deletion are always blocked.
exports.deleteUser = async (req, res) => {
  const target = await User.findByPk(req.params.id);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.role === "admin") return res.status(403).json({ error: "Admin accounts can't be removed" });
  if (target.id === req.user.id) return res.status(403).json({ error: "You can't remove your own account" });

  await Vehicle.destroy({ where: { userId: target.id } });
  await target.destroy();
  res.json({ success: true });
};

// GET /api/admin/users — every registered account, properly structured, with their data counts
exports.listUsers = async (req, res) => {
  const users = await User.findAll({
    attributes: { exclude: ["password"] },
    include: [{ model: Vehicle }],
    order: [["createdAt", "DESC"]],
  });

  const structured = users.map((u) => {
    const plain = u.toJSON();
    return {
      id: plain.id,
      name: plain.name,
      email: plain.email,
      role: plain.role,
      district: plain.district,
      createdAt: plain.createdAt,
      vehicleCount: plain.Vehicles?.length || 0,
      vehicles: (plain.Vehicles || []).map((v) => ({
        id: v.id,
        plateNumber: v.plateNumber,
        type: v.type,
        maintenance: maintenanceStatus(v),
      })),
    };
  });

  res.json({
    users: structured,
    summary: {
      total: structured.length,
      byRole: {
        gov: structured.filter((u) => u.role === "gov").length,
        user: structured.filter((u) => u.role === "user").length,
        admin: structured.filter((u) => u.role === "admin").length,
      },
    },
  });
};

// GET /api/admin/stats — platform-wide counts for the admin overview cards
exports.stats = async (req, res) => {
  const [
    userCount, govCount, residentCount, deviceCount, cameraCount,
    roadReadingCount, vehicleCount, captureCount, nearbyCount, predictionCount,
  ] = await Promise.all([
    User.count(),
    User.count({ where: { role: "gov" } }),
    User.count({ where: { role: "user" } }),
    Device.count(),
    CameraLink.count(),
    RoadTracking.count(),
    Vehicle.count(),
    VehicleCapture.count(),
    NearbyStop.count(),
    Prediction.count(),
  ]);

  const vehicles = await Vehicle.findAll({ raw: true });
  const flaggedCount = vehicles.filter((v) => maintenanceStatus(v).needsMaintenance).length;

  res.json({
    userCount, govCount, residentCount, deviceCount, cameraCount,
    roadReadingCount, vehicleCount, captureCount, nearbyCount, predictionCount, flaggedCount,
  });
};

// POST /api/admin/reset  { scope: "gov" | "users" | "predictions" | "all" }
// Destructive by design — this is the admin's own controlled reset for demo/testing.
// Never touches the admin account itself, and "users" only removes role=user accounts
// (and their vehicles cascade), never gov or admin accounts.
exports.reset = async (req, res) => {
  const scope = req.body.scope;
  const results = {};

  if (scope === "gov" || scope === "all") {
    results.devices = (await Device.destroy({ where: {}, truncate: true })) ?? "done";
    results.cameras = (await CameraLink.destroy({ where: {}, truncate: true })) ?? "done";
    results.roads = (await RoadTracking.destroy({ where: {}, truncate: true })) ?? "done";
    results.captures = (await VehicleCapture.destroy({ where: {}, truncate: true })) ?? "done";
    results.nearby = (await NearbyStop.destroy({ where: {}, truncate: true })) ?? "done";
  }

  if (scope === "users" || scope === "all") {
    results.vehicles = (await Vehicle.destroy({ where: {}, truncate: true })) ?? "done";
    results.residentAccountsRemoved = await User.destroy({ where: { role: "user" } });
  }

  if (scope === "predictions" || scope === "all") {
    results.predictions = (await Prediction.destroy({ where: {}, truncate: true })) ?? "done";
  }

  if (!results || Object.keys(results).length === 0) {
    return res.status(400).json({ error: "Invalid scope. Use gov, users, predictions, or all." });
  }

  res.json({ success: true, scope, results });
};
