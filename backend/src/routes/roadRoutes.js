const router = require("express").Router();
const ctrl = require("../controllers/roadController");
const { authenticate, requireRole } = require("../middleware/auth");

router.get("/", authenticate, ctrl.list);
router.get("/history", authenticate, ctrl.history);
router.post("/", authenticate, requireRole("gov"), ctrl.create);

module.exports = router;
