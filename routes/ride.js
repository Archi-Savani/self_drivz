const express = require("express");
const router = express.Router();
const { auth, requireAdmin, requireRider } = require("../middlewares/auth");
const rideController = require("../controllers/ride");
const { ensureApprovedKyc } = require("../middlewares/kyc");

// Create booking (idRider must be true, status defaults to pending)
router.post("/", auth, requireRider, ensureApprovedKyc, rideController.createRide);

// List bookings
router.get("/", auth, rideController.getRides);

// Get booking by id
router.get("/:id", auth, rideController.getRideById);

// Update booking (non-status)
router.put("/:id", auth, requireRider, ensureApprovedKyc, rideController.updateRide);

// Admin-only: change status to approve/reject
router.patch("/:id/status", auth, requireAdmin, rideController.updateRideStatus);

module.exports = router;


