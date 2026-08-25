const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// User: "check nearby market stop" — nearby markets/rest stops with live-ish AQI
const NearbyStop = sequelize.define("NearbyStop", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM("market", "rest_area", "hospital", "school"), defaultValue: "market" },
  district: { type: DataTypes.STRING, allowNull: false },
  latitude: { type: DataTypes.FLOAT, allowNull: false },
  longitude: { type: DataTypes.FLOAT, allowNull: false },
  currentAqi: { type: DataTypes.INTEGER, defaultValue: 0 },
});

module.exports = NearbyStop;
