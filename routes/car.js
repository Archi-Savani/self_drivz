// routes/carRoutes.js
const express = require("express");
const router = express.Router();
const carController = require("../controllers/car");
const { auth } = require("../middlewares/auth");
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

// Add car (multiple images + video + docs)
router.post(
    "/",
    auth,
    upload.fields([
        { name: "carImages", maxCount: 10 },
        { name: "video", maxCount: 1 },
        { name: "insurancePhoto", maxCount: 1 },
        { name: "pollutionCertificate", maxCount: 1 },
        { name: "taxToken", maxCount: 1 },
        { name: "rcBook", maxCount: 1 },
    ]),
    carController.addCar
);

// Update car (same uploads as add)
router.put(
    "/:id",
    auth,
    upload.fields([
        { name: "carImages", maxCount: 10 },
        { name: "video", maxCount: 1 },
        { name: "insurancePhoto", maxCount: 1 },
        { name: "pollutionCertificate", maxCount: 1 },
        { name: "taxToken", maxCount: 1 },
        { name: "rcBook", maxCount: 1 },
    ]),
    carController.updateCar
);

// Delete car
router.delete("/:id", auth, carController.deleteCar);

// Approve car (admin only)
router.put("/:id/approve", auth, carController.approveCar);

module.exports = router;
