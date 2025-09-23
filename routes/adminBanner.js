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

// Add a banner (image/video)
router.post(
    "/",
    auth, // logged-in user
    upload.fields([{ name: "bannerImage", maxCount: 1 }]), // single file
    adminBannerController.addBanner
);

router.put(
    "/:id",
    auth,
    upload.fields([{ name: "bannerImage", maxCount: 1 }]),
    adminBannerController.updateBanner
);

// Delete a banner
router.delete("/:id", auth, adminBannerController.deleteBanner);

module.exports = router;
