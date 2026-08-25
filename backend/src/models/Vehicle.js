const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// User: "add data of their vehicle"
const Vehicle = sequelize.define("Vehicle", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  plateNumber: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM("car", "bike", "rickshaw", "truck", "van", "bus"), allowNull: false },
  fuelType: { type: DataTypes.ENUM("petrol", "diesel", "cng", "electric", "hybrid"), defaultValue: "petrol" },
  manufactureYear: { type: DataTypes.INTEGER },
  emissionEstimate: { type: DataTypes.FLOAT, defaultValue: 0 }, // relative emission score 0-100
  lastServiceDate: { type: DataTypes.DATEONLY, allowNull: true },
  videoUrl: { type: DataTypes.STRING, allowNull: true }, // owner-submitted vehicle condition/dashcam video link
  // Owner identification — required so Gov can trace a flagged/high-emission vehicle
  ownerCnic: { type: DataTypes.STRING, allowNull: false },
  ownerContact: { type: DataTypes.STRING, allowNull: false }, // owner's own phone number
  fatherName: { type: DataTypes.STRING, allowNull: true },
  fatherContact: { type: DataTypes.STRING, allowNull: false }, // father's phone number, per registration requirement
  fatherCnic: { type: DataTypes.STRING, allowNull: true },
});

module.exports = Vehicle;
