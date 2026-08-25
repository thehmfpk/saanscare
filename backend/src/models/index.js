const sequelize = require("../config/db");
const User = require("./User");
const Device = require("./Device");
const AQIReading = require("./AQIReading");
const RoadTracking = require("./RoadTracking");
const CameraLink = require("./CameraLink");
const Vehicle = require("./Vehicle");
const VehicleCapture = require("./VehicleCapture");
const NearbyStop = require("./NearbyStop");
const Prediction = require("./Prediction");

// Associations
User.hasMany(Device, { foreignKey: "addedBy" });
Device.belongsTo(User, { foreignKey: "addedBy" });

User.hasMany(CameraLink, { foreignKey: "addedBy" });
CameraLink.belongsTo(User, { foreignKey: "addedBy" });

User.hasMany(Vehicle, { foreignKey: "userId", onDelete: "CASCADE" });
Vehicle.belongsTo(User, { foreignKey: "userId" });

module.exports = {
  sequelize,
  User,
  Device,
  AQIReading,
  RoadTracking,
  CameraLink,
  Vehicle,
  VehicleCapture,
  NearbyStop,
  Prediction,
};
