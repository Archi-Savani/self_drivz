// models/AdminBanner.js
const mongoose = require("mongoose");

const adminBannerSchema = new mongoose.Schema(
    {
        bannerImage: {
            type: String, // URL of image or video (stored on Cloudinary or other storage)
            required: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        subtitle: {
            type: String,
            trim: true,
        },
        mediaType: {
            type: String,
            enum: ["image", "video"], // To differentiate
            required: true,
        },
    },
    {
        timestamps: true, // adds createdAt, updatedAt
    }
);

module.exports = mongoose.model("AdminBanner", adminBannerSchema);
