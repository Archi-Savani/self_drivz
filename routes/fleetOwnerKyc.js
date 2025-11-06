const express = require("express");
const router = express.Router();
const {
    createOrUpdateFleetOwnerKyc,
    getMyFleetOwnerKyc,
    getAllFleetOwnerKycs,
    getFleetOwnerKycByEmail,
    getFleetOwnerKycById,
    updateFleetOwnerKycStatus,
    approveFleetOwnerKycByAdmin,
    updateFleetOwnerKyc,
    deleteFleetOwnerKyc,
} = require("../controllers/fleetOwnerKyc");
const { auth, requireAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// FleetOwner: Create or Update FleetOwnerKyc
router.post(
    "/submit",
    auth,
    upload.fields([
        { name: "passbook", maxCount: 1 },
        { name: "panCard", maxCount: 1 },
        { name: "gstCertificate", maxCount: 1 },
    ]),
    createOrUpdateFleetOwnerKyc
);

// FleetOwner: Get my FleetOwnerKyc
router.get("/me", auth, getMyFleetOwnerKyc);

// FleetOwner: Update my FleetOwnerKyc (by email from token)
router.put(
    "/me",
    auth,
    upload.fields([
        { name: "passbook", maxCount: 1 },
        { name: "panCard", maxCount: 1 },
        { name: "gstCertificate", maxCount: 1 },
    ]),
    updateFleetOwnerKyc
);

// Admin: Get all FleetOwnerKycs
router.get("/", auth, requireAdmin, getAllFleetOwnerKycs);

// Admin: Get FleetOwnerKyc by email
router.get("/email/:email", auth, requireAdmin, getFleetOwnerKycByEmail);

// Admin: Get FleetOwnerKyc by ID
router.get("/:id", auth, requireAdmin, getFleetOwnerKycById);

// Admin: Approve FleetOwnerKyc
router.put("/:id/approve", auth, requireAdmin, approveFleetOwnerKycByAdmin);

// Admin: Update FleetOwnerKyc status
router.put("/:id/status", auth, requireAdmin, updateFleetOwnerKycStatus);

// Update FleetOwnerKyc by ID (owner or admin)
router.put(
    "/:id",
    auth,
    upload.fields([
        { name: "passbook", maxCount: 1 },
        { name: "panCard", maxCount: 1 },
        { name: "gstCertificate", maxCount: 1 },
    ]),
    updateFleetOwnerKyc
);

// Admin: Delete FleetOwnerKyc
router.delete("/:id", auth, requireAdmin, deleteFleetOwnerKyc);

module.exports = router;

