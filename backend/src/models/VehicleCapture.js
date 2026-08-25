const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Gov: "vehicle images capture" — log of vehicles captured by devices/cameras
const VehicleCapture = sequelize.define("VehicleCapture", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  plateNumber: { type: DataTypes.STRING, allowNull: false },
  area: { type: DataTypes.STRING, allowNull: false },
  imageUrl: { type: DataTypes.STRING },
  emissionFlag: { type: DataTypes.ENUM("normal", "high_emission", "unverified"), defaultValue: "unverified" },
  capturedAt: { type: DataTypes.DATE, allowNull: false },
});

module.exports = VehicleCapture;
