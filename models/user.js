const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        photo: {
            type: String, // Cloudinary image URL
            required: false,
        },
        name: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        addBio: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: ["Admin", "Rider", "FleetOwner"], // only these values allowed
            default: "Rider", // default role
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
