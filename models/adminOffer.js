// models/AdminOffer.js
const mongoose = require("mongoose");

const adminOfferSchema = new mongoose.Schema(
    {
        offerFor: {
            type: String,
            enum: ["rider", "fleetowner"],
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        offerCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        subtitle: {
            type: String,
            trim: true,
        },
        discount: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        termsAndCondition: {
            type: String,
            trim: true,
        },
        expiryDate: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("AdminOffer", adminOfferSchema);
