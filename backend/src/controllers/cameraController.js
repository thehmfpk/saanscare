const { CameraLink } = require("../models");

exports.list = async (req, res) => {
  const cameras = await CameraLink.findAll({ order: [["createdAt", "DESC"]] });
  res.json({ cameras });
};

exports.create = async (req, res) => {
  try {
    const { name, area, streamUrl, referenceVideoUrl, latitude, longitude } = req.body;
    const camera = await CameraLink.create({
      name, area, streamUrl, referenceVideoUrl: referenceVideoUrl || null, latitude, longitude, addedBy: req.user.id,
    });
    res.status(201).json({ camera });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Detail view for the click-through camera modal. There's no real RTSP/CCTV feed wired up
// (that would need actual Safe City hardware access), so this returns the camera's live
// status plus a simulated recent-recording clip list with the SAME shape a real integration
// would return — swap the `clips` generation for a real VMS/NVR API call later.
exports.getOne = async (req, res) => {
  const camera = await CameraLink.findByPk(req.params.id);
  if (!camera) return res.status(404).json({ error: "Camera not found" });

  const isOnline = camera.status === "online";
  const now = Date.now();
  const clips = isOnline
    ? Array.from({ length: 6 }).map((_, i) => ({
        id: `${camera.id}-clip-${i}`,
        startedAt: new Date(now - i * 45 * 60 * 1000).toISOString(),
        durationSec: 60 + (i % 3) * 30,
        thumbnailSeed: (camera.id * 13 + i * 7) % 360,
      }))
    : [];

  res.json({
    camera,
    live: {
      status: isOnline ? "live" : "offline",
      message: isOnline
        ? "Simulated live preview — connect a real RTSP/VMS endpoint at streamUrl to replace this."
        : "Camera is offline — no live feed available.",
    },
    clips,
  });
};

exports.remove = async (req, res) => {
  const camera = await CameraLink.findByPk(req.params.id);
  if (!camera) return res.status(404).json({ error: "Camera not found" });
  await camera.destroy();
  res.json({ success: true });
};
