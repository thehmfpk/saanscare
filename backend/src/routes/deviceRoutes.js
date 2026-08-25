const router = require("express").Router();
const ctrl = require("../controllers/deviceController");
const { authenticate, requireRole } = require("../middleware/auth");

router.get("/", authenticate, ctrl.list);
router.get("/:id", authenticate, ctrl.getOne);
router.post("/", authenticate, requireRole("gov"), ctrl.create);
router.put("/:id", authenticate, requireRole("gov"), ctrl.update);
router.delete("/:id", authenticate, requireRole("gov"), ctrl.remove);

module.exports = router;
