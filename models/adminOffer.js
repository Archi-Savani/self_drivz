// models/AdminOffer.js
const mongoose = require("mongoose");

const adminOfferSchema = new mongoose.Schema(
    {
        offerCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        discount: {
            type: Number,
            required: true,
            min: 0,
            max: 100, // percentage discount
        },
        expires: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("AdminOffer", adminOfferSchema);
