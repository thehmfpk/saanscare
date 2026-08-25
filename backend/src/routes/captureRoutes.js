const router = require("express").Router();
const ctrl = require("../controllers/captureController");
const { authenticate, requireRole } = require("../middleware/auth");

router.get("/", authenticate, ctrl.list);
router.post("/", authenticate, requireRole("gov"), ctrl.create);

module.exports = router;
