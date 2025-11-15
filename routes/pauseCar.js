const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const pauseCarController = require("../controllers/pauseCar");

router.post("/", auth, pauseCarController.createPauseCar);
router.get("/", auth, pauseCarController.getPauseCars);
router.get("/:id", auth, pauseCarController.getPauseCarById);
router.patch("/:id/approve", auth, pauseCarController.approvePauseCar);

module.exports = router;


