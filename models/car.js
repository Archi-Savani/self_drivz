// models/Car.js
const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
            enum: ["Sedan", "SUV", "Hatchback", "Luxury", "Van", "Other"],
        },
        hourlyRate: {
            type: Number,
            required: true,
            min: 0,
        },
        kmPerHour: {
            type: Number,
            required: true,
            min: 0,
        },
        transmission: {
            type: String,
            required: true,
            enum: ["Auto", "Manual"],
        },
        fuel: {
            type: String,
            required: true,
            enum: ["Electric", "Petrol", "Diesel", "CNG"],
        },
        carImages: {
            type: [String], // array of image URLs
            validate: [arrayLimit, "{PATH} exceeds the limit of 10"],
            default: [],
        },
        video: {
            type: String, // video URL or path
        },
        status: {
            type: String,
            enum: ["Pending", "Approved"],
            default: "Pending",
        },
    },
    {
        timestamps: true,
    }
);

// Validator for max 10 images
function arrayLimit(val) {
    return val.length <= 10;
}

module.exports = mongoose.model("Car", carSchema);
