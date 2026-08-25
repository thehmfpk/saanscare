require("dotenv").config();
const bcrypt = require("bcryptjs");
const {
  sequelize,
  User,
  Device,
  AQIReading,
  RoadTracking,
  CameraLink,
  Vehicle,
  VehicleCapture,
  NearbyStop,
} = require("../models");

// Lahore zones, each roughly matching a Punjab EPA monitoring area, with a
// relative "dirtiness" multiplier (industrial/high-traffic zones run hotter).
const ZONES = [
  { name: "Gulberg", lat: 31.5204, lng: 74.3487, factor: 1.0 },
  { name: "DHA", lat: 31.4697, lng: 74.4139, factor: 0.85 },
  { name: "Johar Town", lat: 31.4697, lng: 74.2728, factor: 0.95 },
  { name: "Model Town", lat: 31.4818, lng: 74.3247, factor: 0.9 },
  { name: "Township", lat: 31.4258, lng: 74.2757, factor: 1.05 },
  { name: "Shalimar", lat: 31.6015, lng: 74.3697, factor: 1.25 },
  { name: "Wagah", lat: 31.6044, lng: 74.5717, factor: 1.15 },
  { name: "Ravi Town", lat: 31.6180, lng: 74.2800, factor: 1.2 },
];

// Typical monthly AQI baseline for Lahore (winter smog Nov-Feb, cleaner monsoon/summer)
const MONTHLY_BASE = [220, 185, 145, 115, 95, 85, 80, 85, 105, 145, 205, 235]; // Jan..Dec

function categoryFor(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function randNoise(spread) {
  return (Math.random() - 0.5) * 2 * spread;
}

async function seedAQIHistory() {
  const YEARS_BACK = 2;
  const today = new Date();
  const start = new Date(today);
  start.setFullYear(start.getFullYear() - YEARS_BACK);

  const rows = [];
  for (const zone of ZONES) {
    let d = new Date(start);
    let dayIndex = 0;
    while (d <= today) {
      const month = d.getMonth();
      const yearsAgo = (today - d) / (1000 * 60 * 60 * 24 * 365);
      // slight year-over-year worsening trend (~4%/yr) as we approach "today"
      const trendFactor = 1 + 0.04 * (YEARS_BACK - yearsAgo);
      const base = MONTHLY_BASE[month] * zone.factor * trendFactor;
      const aqi = Math.max(15, Math.round(base + randNoise(18)));
      const pm25 = Math.round(aqi * 0.6 + randNoise(5));
      const pm10 = Math.round(aqi * 0.85 + randNoise(8));

      rows.push({
        district: zone.name,
        latitude: zone.lat + randNoise(0.01),
        longitude: zone.lng + randNoise(0.01),
        aqi,
        pm25,
        pm10,
        category: categoryFor(aqi),
        recordedAt: new Date(d),
        source: "seed",
      });

      d.setDate(d.getDate() + 1);
      dayIndex++;
    }
  }

  // bulkCreate in chunks to stay memory-friendly
  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await AQIReading.bulkCreate(rows.slice(i, i + CHUNK));
  }
  console.log(`Seeded ${rows.length} AQI readings across ${ZONES.length} zones (${YEARS_BACK} years).`);
}

async function seedAccounts() {
  const govPass = await bcrypt.hash("Gov@12345", 10);
  const userPass = await bcrypt.hash("User@12345", 10);
  const adminPass = await bcrypt.hash("Admin@12345", 10);

  const [gov] = await User.findOrCreate({
    where: { email: "gov@saanscare.pk" },
    defaults: { name: "EPA Lahore Officer", password: govPass, role: "gov", district: "Lahore" },
  });

  const [user] = await User.findOrCreate({
    where: { email: "user@saanscare.pk" },
    defaults: { name: "Ali Resident", password: userPass, role: "user", district: "Gulberg" },
  });

  const [admin] = await User.findOrCreate({
    where: { email: "admin@saanscare.pk" },
    defaults: { name: "Hafiz Muhammad Faizan", password: adminPass, role: "admin", district: "DHA" },
  });

  console.log("Seeded demo accounts:");
  console.log("  Gov   -> gov@saanscare.pk   / Gov@12345");
  console.log("  User  -> user@saanscare.pk  / User@12345");
  console.log("  Admin -> admin@saanscare.pk / Admin@12345");

  return { gov, user, admin };
}

async function seedDevices(govUserId) {
  const types = ["AQI Monitor", "PM2.5 Sensor Node"];
  const devices = [];
  let counter = 1;
  for (const z of ZONES) {
    for (const type of types) {
      devices.push({
        deviceCode: `SC-DEV-${String(counter).padStart(3, "0")}`,
        name: `${z.name} ${type}`,
        type,
        district: z.name,
        latitude: z.lat + randNoise(0.006),
        longitude: z.lng + randNoise(0.006),
        status: counter % 9 === 0 ? "maintenance" : counter % 11 === 0 ? "inactive" : "active",
        addedBy: govUserId,
      });
      counter++;
    }
  }
  await Device.bulkCreate(devices);
  console.log(`Seeded ${devices.length} devices across ${ZONES.length} districts.`);
}

// Real, well-known Lahore Safe City / high-traffic camera points (approximate public
// coordinates for these landmarks). PSCA's actual camera feeds are a closed government
// network with no public API/RTSP access, so `referenceVideoUrl` points to Lahore
// Traffic Police's official public YouTube channel as clearly-labeled reference
// footage — not a claim that this is the live feed from that exact camera.
const SAFE_CITY_POINTS = [
  { name: "Liberty Roundabout Camera", area: "Gulberg", lat: 31.5085, lng: 74.3452 },
  { name: "Kalma Chowk Camera", area: "Gulberg", lat: 31.5060, lng: 74.3436 },
  { name: "Thokar Niaz Baig Camera", area: "Township", lat: 31.4453, lng: 74.2543 },
  { name: "Mall Road (Charing Cross) Camera", area: "Model Town", lat: 31.5600, lng: 74.3290 },
  { name: "Ferozepur Road Camera", area: "Johar Town", lat: 31.4740, lng: 74.2810 },
  { name: "Canal Bank Road (Doctors' Hospital) Camera", area: "DHA", lat: 31.4750, lng: 74.3820 },
  { name: "GT Road Interchange Camera", area: "Shalimar", lat: 31.6050, lng: 74.3550 },
  { name: "Wagah Border Approach Camera", area: "Wagah", lat: 31.6040, lng: 74.5700 },
];
const REFERENCE_VIDEO_URL = "https://www.youtube.com/channel/UCLplb78cahA_YCq7bfzcZtA"; // Lahore Traffic Police (official)

async function seedCameras(govUserId) {
  const cameras = SAFE_CITY_POINTS.map((p, i) => ({
    name: p.name,
    area: p.area,
    streamUrl: `rtsp://internal.psca.gop.pk/cam-${i + 1}`, // placeholder — real PSCA endpoint not public
    referenceVideoUrl: REFERENCE_VIDEO_URL,
    latitude: p.lat + randNoise(0.002),
    longitude: p.lng + randNoise(0.002),
    status: i === 6 ? "offline" : "online", // one offline camera for realism
    addedBy: govUserId,
  }));
  await CameraLink.bulkCreate(cameras);
  console.log(`Seeded ${cameras.length} Safe City camera links at real Lahore landmarks.`);
}

async function seedRoads() {
  const roadNames = [
    "Ferozepur Road", "Canal Bank Road", "Mall Road", "Ring Road",
    "Multan Road", "GT Road", "Jail Road", "Airport Road",
  ];
  const congestionLevels = ["low", "medium", "high", "severe"];
  const rows = [];
  const now = new Date();

  for (let i = 0; i < roadNames.length; i++) {
    const zone = ZONES[i % ZONES.length];
    for (let d = 0; d < 14; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      rows.push({
        roadName: roadNames[i],
        area: zone.name,
        district: zone.name,
        latitude: zone.lat + randNoise(0.02),
        longitude: zone.lng + randNoise(0.02),
        congestionLevel: congestionLevels[Math.floor(Math.random() * congestionLevels.length)],
        pollutionIndex: Math.min(100, Math.round((45 + Math.random() * 55) * 10) / 10),
        recordedAt: date,
      });
    }
  }
  await RoadTracking.bulkCreate(rows);
  console.log(`Seeded ${rows.length} road-tracking records across ${roadNames.length} roads.`);
}

async function seedNearbyStops() {
  const stops = [
    { name: "Liberty Market", type: "market", zone: ZONES[0] },
    { name: "Fortress Stadium Market", type: "market", zone: ZONES[1] },
    { name: "Model Town Park Rest Area", type: "rest_area", zone: ZONES[3] },
    { name: "Township Sunday Bazaar", type: "market", zone: ZONES[4] },
    { name: "Shalimar Gardens Rest Point", type: "rest_area", zone: ZONES[5] },
    { name: "Ichhra Market", type: "market", zone: ZONES[2] },
  ];
  const rows = stops.map((s) => ({
    name: s.name,
    type: s.type,
    district: s.zone.name,
    latitude: s.zone.lat + randNoise(0.008),
    longitude: s.zone.lng + randNoise(0.008),
    currentAqi: Math.max(20, Math.round(MONTHLY_BASE[new Date().getMonth()] * s.zone.factor + randNoise(15))),
  }));
  await NearbyStop.bulkCreate(rows);
  console.log(`Seeded ${rows.length} nearby stops.`);
}

async function seedVehicleCaptures() {
  const plates = ["LEA-2201", "LEB-3312", "LEC-9087", "LED-1145", "LEZ-6620"];
  const flags = ["normal", "high_emission", "unverified"];
  const rows = plates.map((p, i) => ({
    plateNumber: p,
    area: ZONES[i % ZONES.length].name,
    imageUrl: `https://safecity.punjab.gov.pk/captures/demo-${i + 1}.jpg`,
    emissionFlag: flags[i % flags.length],
    capturedAt: new Date(Date.now() - i * 3600 * 1000),
  }));
  await VehicleCapture.bulkCreate(rows);
  console.log(`Seeded ${rows.length} vehicle capture records.`);
}

async function seedDemoVehicle(userId) {
  await Vehicle.findOrCreate({
    where: { plateNumber: "LEX-4471", userId },
    defaults: {
      plateNumber: "LEX-4471",
      type: "car",
      fuelType: "petrol",
      manufactureYear: 2016,
      emissionEstimate: 55,
      lastServiceDate: "2025-11-02",
      videoUrl: "https://www.youtube.com/watch?v=6_b7RDuLwcI", // sample attached vehicle-condition video
      ownerCnic: "35202-1234567-1",
      ownerContact: "0300-1234567",
      fatherName: "Muhammad Rashid",
      fatherContact: "0321-7654321",
      fatherCnic: "35202-7654321-3",
      userId,
    },
  });
  await Vehicle.findOrCreate({
    where: { plateNumber: "LEA-9012", userId },
    defaults: {
      plateNumber: "LEA-9012",
      type: "bike",
      fuelType: "petrol",
      manufactureYear: 2012,
      emissionEstimate: 78,
      lastServiceDate: null,
      ownerCnic: "35202-1234567-1",
      ownerContact: "0300-1234567",
      fatherName: "Muhammad Rashid",
      fatherContact: "0321-7654321",
      fatherCnic: "35202-7654321-3",
      userId,
    },
  });
  console.log("Seeded 2 demo vehicles for the demo user account (one overdue for maintenance).");
}

async function main() {
  await sequelize.sync({ force: true }); // fresh demo DB every seed run
  console.log("Database synced. Seeding...");

  const { gov, user } = await seedAccounts();
  await seedAQIHistory();
  await seedDevices(gov.id);
  await seedCameras(gov.id);
  await seedRoads();
  await seedNearbyStops();
  await seedVehicleCaptures();
  await seedDemoVehicle(user.id);

  console.log("\nSeed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
