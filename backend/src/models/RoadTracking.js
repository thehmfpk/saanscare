const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Gov: "tracking road by area" — road-segment level pollution/congestion tracking
const RoadTracking = sequelize.define("RoadTracking", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  roadName: { type: DataTypes.STRING, allowNull: false },
  area: { type: DataTypes.STRING, allowNull: false },
  district: { type: DataTypes.STRING, allowNull: false },
  latitude: { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
  congestionLevel: { type: DataTypes.ENUM("low", "medium", "high", "severe"), defaultValue: "medium" },
  pollutionIndex: { type: DataTypes.FLOAT, defaultValue: 0 },
  recordedAt: { type: DataTypes.DATE, allowNull: false },
});

module.exports = RoadTracking;
