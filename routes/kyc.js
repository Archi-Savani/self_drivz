const express = require("express");
const router = express.Router();
const { submitKyc, listKycs, getKycByUser, updateKycStatus, getMyKyc } = require("../controllers/kyc");
const { auth, requireAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Rider: submit or resubmit KYC
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
    submitKyc
);

// Rider/Admin: get my KYC
router.get("/me", auth, getMyKyc);

// Admin: list all KYC
router.get("/", auth, requireAdmin, listKycs);

// Admin: get KYC by user id
router.get("/:userId", auth, requireAdmin, getKycByUser);

// Admin: update status
router.put("/:userId/status", auth, requireAdmin, updateKycStatus);

module.exports = router;


