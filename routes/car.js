// routes/carRoutes.js
const express = require("express");
const router = express.Router();
const carController = require("../controllers/car");
const auth = require("../middlewares/auth");
const multer = require("multer");

// Multer setup for memory storage (needed for Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ----------------------
// Public routes
// ----------------------
router.get("/", auth, carController.getCars); // get all cars
router.get("/:id", auth, carController.getCarById); // get single car

// ----------------------
// Protected routes (FleetOwner only can add/update/delete)
// ----------------------

// Add car (multiple images + 1 video)
router.post(
    "/",
    auth,
    upload.fields([
        { name: "carImages", maxCount: 10 },
        { name: "video", maxCount: 1 },
    ]),
    carController.addCar
);

// Update car (multiple images + 1 video)
router.put(
    "/:id",
    auth,
    upload.fields([
        { name: "carImages", maxCount: 10 },
        { name: "video", maxCount: 1 },
    ]),
    carController.updateCar
);

// Delete car
router.delete("/:id", auth, carController.deleteCar);

module.exports = router;
