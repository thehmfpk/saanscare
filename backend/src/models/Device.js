const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Gov: "add devices" — monitoring stations placed around the city
const Device = sequelize.define("Device", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  deviceCode: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, defaultValue: "AQI Monitor" },
  district: { type: DataTypes.STRING, allowNull: false },
  latitude: { type: DataTypes.FLOAT, allowNull: false },
  longitude: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.ENUM("active", "inactive", "maintenance"), defaultValue: "active" },
});

module.exports = Device;
