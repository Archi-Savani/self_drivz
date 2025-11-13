const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
    {
        carName: {
            type: String,
            required: true,
            trim: true,
        },
        brand: {
            type: String,
            required: true,
            trim: true,
        },
        model: {
            type: String,
            required: true,
            trim: true,
        },
        year: {
            type: Number,
            required: true,
        },
        color: {
            type: String,
            required: true,
            trim: true,
        },
        RegNo: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        transmission: {
            type: String,
            required: true,
            enum: ["auto", "manual"],
            lowercase: true,
        },
        fuelType: {
            type: String,
            required: true,
            trim: true,
        },
        seating: {
            type: Number,
            required: true,
            min: 1,
        },
        pricePerDay: {
            type: Number,
            required: true,
            min: 0,
        },
        UnitsAvailable: {
            type: Number,
            required: true,
            min: 0,
            default: 1,
        },
        carstatus: {
            type: String,
            enum: ["available", "unavailable", "maintenance"],
            default: "unavailable",
            lowercase: true,
        },
        dec: {
            type: String,
            trim: true,
        },
        variant: {
            type: String,
            trim: true,
        },
        features: {
            type: [String], // array of feature strings
            default: [],
        },
        carImage: {
            type: [String], // array of Cloudinary image URLs
            required: true,
            validate: [
                {
                    validator: function(value) {
                        return Array.isArray(value) && value.length >= 5 && value.length <= 10;
                    },
                    message: "carImage must have between 5 and 10 images",
                },
            ],
        },
        video: {
            type: String, // Cloudinary video URL
        },
        insurance: {
            type: String, // Cloudinary image URL
            required: true,
        },
        pollution: {
            type: String, // Cloudinary image URL
            required: true,
        },
        tacToken: {
            type: String, // Cloudinary image URL
            required: true,
        },
        rcBook: {
            type: String, // Cloudinary image URL
            required: true,
        },
        fleetBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            lowercase: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Car", carSchema);
