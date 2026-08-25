require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");

const authRoutes = require("./routes/authRoutes");
const aqiRoutes = require("./routes/aqiRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const roadRoutes = require("./routes/roadRoutes");
const cameraRoutes = require("./routes/cameraRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const captureRoutes = require("./routes/captureRoutes");
const nearbyRoutes = require("./routes/nearbyRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "SaansCare API" }));

app.use("/api/auth", authRoutes);
app.use("/api/aqi", aqiRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/roads", roadRoutes);
app.use("/api/cameras", cameraRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/captures", captureRoutes);
app.use("/api/nearby", nearbyRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SaansCare API running on port ${PORT} (DB dialect: ${process.env.DB_DIALECT || "sqlite"})`);
    });
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
    process.exit(1);
  });

module.exports = app;
