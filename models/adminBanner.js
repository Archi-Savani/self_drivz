// models/AdminBanner.js
const mongoose = require("mongoose");

const adminBannerSchema = new mongoose.Schema(
    {
        bannerImage: {
            type: [String], // array of image URLs (Cloudinary)
            required: true,
            validate: [
                function(value) {
                    return Array.isArray(value) && value.length > 0 && value.length <= 5;
                },
                "bannerImage must have between 1 and 5 images",
            ],
        },
    },
    {
        timestamps: true, // adds createdAt, updatedAt
    }
);

module.exports = mongoose.model("AdminBanner", adminBannerSchema);
