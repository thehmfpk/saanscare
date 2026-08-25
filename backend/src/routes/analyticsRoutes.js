const router = require("express").Router();
const ctrl = require("../controllers/analyticsController");
const { authenticate, requireRole } = require("../middleware/auth");

router.get("/gov", authenticate, requireRole("gov"), ctrl.govOverview);
router.get("/user", authenticate, requireRole("user"), ctrl.userOverview);

module.exports = router;
