const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Cached AI (Groq) or fallback narrative forecasts, so we don't re-call the LLM every request
const Prediction = sequelize.define("Prediction", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  district: { type: DataTypes.STRING, allowNull: false },
  periodLabel: { type: DataTypes.STRING, allowNull: false }, // e.g. "Next 12 Months"
  narrative: { type: DataTypes.TEXT, allowNull: false },
  riskLevel: { type: DataTypes.ENUM("low", "moderate", "high", "severe"), defaultValue: "moderate" },
  generatedBy: { type: DataTypes.ENUM("groq", "fallback"), defaultValue: "fallback" },
  statsSnapshot: { type: DataTypes.TEXT }, // JSON string
});

module.exports = Prediction;
