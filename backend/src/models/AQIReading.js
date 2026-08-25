const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Core AQI dataset — historical (seeded) + live (device/API sourced)
const AQIReading = sequelize.define("AQIReading", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  district: { type: DataTypes.STRING, allowNull: false },
  latitude: { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
  aqi: { type: DataTypes.INTEGER, allowNull: false },
  pm25: { type: DataTypes.FLOAT },
  pm10: { type: DataTypes.FLOAT },
  category: { type: DataTypes.STRING }, // Good/Moderate/Unhealthy/Hazardous etc.
  recordedAt: { type: DataTypes.DATE, allowNull: false },
  source: { type: DataTypes.ENUM("seed", "device", "punjab_epa"), defaultValue: "seed" },
});

module.exports = AQIReading;
