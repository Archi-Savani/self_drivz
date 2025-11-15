const express = require("express");
const router = express.Router();
const carController = require("../controllers/car");
const { auth, requireAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Public/Protected: Get all cars (approved and available for non-admin, all for admin)
router.get("/", auth, carController.getCars);

// Public/Protected: Get single car by ID
router.get("/:id", auth, carController.getCarById);

// Protected: Add car (FleetOwner and Admin only, not Rider)
router.post(
    "/",
    auth,
    upload.fields([
        { name: "carImage", maxCount: 10 }, // min 5, max 10
        { name: "video", maxCount: 1 },
        { name: "insurance", maxCount: 1 },
        { name: "pollution", maxCount: 1 },
        { name: "tacToken", maxCount: 1 },
        { name: "rcBook", maxCount: 1 },
    ]),
    carController.addCar
);

// Protected: Update car (FleetOwner and Admin only)
router.put(
    "/:id",
    auth,
    upload.fields([
        { name: "carImage", maxCount: 10 },
        { name: "video", maxCount: 1 },
        { name: "insurance", maxCount: 1 },
        { name: "pollution", maxCount: 1 },
        { name: "tacToken", maxCount: 1 },
        { name: "rcBook", maxCount: 1 },
    ]),
    carController.updateCar
);

// Protected: Delete car (FleetOwner and Admin only)
router.delete("/:id", auth, carController.deleteCar);

// Admin only: Approve car
router.put("/:id/approve", auth, requireAdmin, carController.approveCar);

// Admin only: Reject car
router.put("/:id/reject", auth, requireAdmin, carController.rejectCar);

// Admin only: Block car
router.put("/:id/block", auth, requireAdmin, carController.blockCar);

// Admin only: Update car status
router.put("/:id/status", auth, requireAdmin, carController.updateCarStatus);

module.exports = router;
