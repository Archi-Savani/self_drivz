// routes/adminBannerRoutes.js
const express = require("express");
const router = express.Router();
const adminBannerController = require("../controllers/adminBanner");
const { auth } = require("../middlewares/auth");
const multer = require("multer");

// Multer setup for memory storage (needed for Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ----------------------
// Public/Protected routes
// ----------------------
// Get all banners (any logged-in user)
router.get("/", auth, adminBannerController.getBanners);

// ----------------------
// Admin-only routes
// ----------------------

// Add banners (1-5 images)
router.post(
    "/",
    auth, // logged-in user
    upload.fields([{ name: "bannerImage", maxCount: 5 }]), // up to 5 files
    adminBannerController.addBanner
);

router.put(
    "/:id",
    auth,
    upload.fields([{ name: "bannerImage", maxCount: 5 }]),
    adminBannerController.updateBanner
);

// Delete a banner
router.delete("/:id", auth, adminBannerController.deleteBanner);

module.exports = router;
