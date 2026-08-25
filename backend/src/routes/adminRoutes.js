const router = require("express").Router();
const ctrl = require("../controllers/adminController");
const { authenticate, requireRole } = require("../middleware/auth");

router.use(authenticate, requireRole("admin"));

router.get("/users", ctrl.listUsers);
router.put("/users/:id", ctrl.updateUser);
router.delete("/users/:id", ctrl.deleteUser);
router.post("/gov", ctrl.addGovOfficial);
router.get("/stats", ctrl.stats);
router.post("/reset", ctrl.reset);

module.exports = router;
