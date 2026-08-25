const router = require("express").Router();
const ctrl = require("../controllers/aqiController");

router.get("/districts", ctrl.listDistricts);
router.get("/history", ctrl.getHistory);
router.get("/trend", ctrl.getTrend);
router.get("/current", ctrl.getCurrentByDistrict);
router.get("/predict", ctrl.predict);

module.exports = router;
