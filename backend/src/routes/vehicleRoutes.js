const router = require("express").Router();
const ctrl = require("../controllers/vehicleController");
const { authenticate, requireRole } = require("../middleware/auth");

router.get("/mine", authenticate, requireRole("user"), ctrl.listMine);
router.get("/", authenticate, requireRole("gov"), ctrl.listAll);
router.post("/", authenticate, requireRole("user"), ctrl.create);
router.delete("/:id", authenticate, requireRole("user"), ctrl.remove);

module.exports = router;
