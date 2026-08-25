const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Gov: "safe city camera links"
const CameraLink = sequelize.define("CameraLink", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  area: { type: DataTypes.STRING, allowNull: false },
  streamUrl: { type: DataTypes.STRING, allowNull: false },
  // Public reference footage (e.g. Lahore Traffic Police's official channel) shown
  // until a real PSCA/Safe City RTSP feed is authorized for this camera — PSCA feeds
  // are not publicly accessible, so this is clearly labeled as reference, not live.
  referenceVideoUrl: { type: DataTypes.STRING, allowNull: true },
  latitude: { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
  status: { type: DataTypes.ENUM("online", "offline"), defaultValue: "online" },
});

module.exports = CameraLink;
