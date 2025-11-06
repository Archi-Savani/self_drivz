const express = require("express");
const router = express.Router();
const {
    createOrUpdateRiderKyc,
    getMyRiderKyc,
    getAllRiderKycs,
    getRiderKycByEmail,
    getRiderKycById,
    updateRiderKycStatus,
    approveRiderKycByAdmin,
    updateRiderKyc,
    deleteRiderKyc,
} = require("../controllers/riderKyc");
const { auth, requireAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Rider: Create or Update RiderKyc
router.post(
    "/submit",
    auth,
    upload.fields([
        { name: "selfie", maxCount: 1 },
        { name: "aadharFront", maxCount: 1 },
        { name: "aadharBack", maxCount: 1 },
        { name: "drivingLicenseFront", maxCount: 1 },
        { name: "drivingLicenseBack", maxCount: 1 },
    ]),
    createOrUpdateRiderKyc
);

// Rider: Get my RiderKyc
router.get("/me", auth, getMyRiderKyc);

// Rider: Update my RiderKyc
router.put(
    "/me",
    auth,
    upload.fields([
        { name: "selfie", maxCount: 1 },
        { name: "aadharFront", maxCount: 1 },
        { name: "aadharBack", maxCount: 1 },
        { name: "drivingLicenseFront", maxCount: 1 },
        { name: "drivingLicenseBack", maxCount: 1 },
    ]),
    updateRiderKyc
);

// Admin: Get all RiderKycs
router.get("/", auth, requireAdmin, getAllRiderKycs);

// Admin: Get RiderKyc by email
router.get("/email/:email", auth, requireAdmin, getRiderKycByEmail);

// Admin: Get RiderKyc by ID
router.get("/:id", auth, requireAdmin, getRiderKycById);

// Admin: Approve RiderKyc
router.put("/:id/approve", auth, requireAdmin, approveRiderKycByAdmin);

// Admin: Update RiderKyc status
router.put("/:id/status", auth, requireAdmin, updateRiderKycStatus);

// Rider: Update RiderKyc by ID
router.put(
    "/:id",
    auth,
    requireAdmin,
    upload.fields([
        { name: "selfie", maxCount: 1 },
        { name: "aadharFront", maxCount: 1 },
        { name: "aadharBack", maxCount: 1 },
        { name: "drivingLicenseFront", maxCount: 1 },
        { name: "drivingLicenseBack", maxCount: 1 },
    ]),
    updateRiderKyc
);


// Admin: Delete RiderKyc
router.delete("/:id", auth, requireAdmin, deleteRiderKyc);

module.exports = router;

