// controllers/adminBannerController.js
const AdminBanner = require("../models/adminBanner");
const { uploadMultipleFiles } = require("../utils/cloudinary"); // cloudinary upload util

// Add Banner - Only Admin
const addBanner = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only Admin can add a banner",
            });
        }

        const { title, subtitle, mediaType } = req.body;

        if (!title || !mediaType) {
            return res.status(400).json({
                success: false,
                message: "Title and mediaType are required",
            });
        }

        if (!req.files || !req.files.bannerImage || req.files.bannerImage.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please upload a banner image or video",
            });
        }

        const fileBuffer = req.files.bannerImage[0].buffer;
        const [uploadedUrl] = await uploadMultipleFiles([fileBuffer]);

        const newBanner = new AdminBanner({
            bannerImage: uploadedUrl,
            title,
            subtitle,
            mediaType,
        });

        await newBanner.save();

        res.status(201).json({
            success: true,
            message: "Banner added successfully",
            data: newBanner,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to add banner",
            error: error.message,
        });
    }
};

// Get all banners
const getBanners = async (req, res) => {
    try {
        const banners = await AdminBanner.find();
        res.status(200).json({ success: true, data: banners });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch banners",
            error: error.message,
        });
    }
};

// Update banner - Only Admin
const updateBanner = async (req, res) => {
    try {
        if (req.user.role !== "Admin") {
            return res.status(403).json({
                success: false,
                message: "Only Admin can update a banner",
            });
        }

        const { title, subtitle, mediaType } = req.body;
        const updatedData = { title, subtitle, mediaType };

        // Upload new banner image/video if provided
        if (req.files && req.files.bannerImage && req.files.bannerImage.length > 0) {
            const fileBuffer = req.files.bannerImage[0].buffer;
            const [uploadedUrl] = await uploadMultipleFiles([fileBuffer]);
            updatedData.bannerImage = uploadedUrl;
        }

        const banner = await AdminBanner.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Banner updated successfully",
            data: banner,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update banner",
            error: error.message,
        });
    }
};

// Delete banner - Only Admin
const deleteBanner = async (req, res) => {
    try {
        if (req.user.role !== "Admin") {
            return res.status(403).json({
                success: false,
                message: "Only Admin can delete a banner",
            });
        }

        const banner = await AdminBanner.findByIdAndDelete(req.params.id);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Banner deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete banner",
            error: error.message,
        });
    }
};

module.exports = { addBanner, getBanners, updateBanner, deleteBanner };
