const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: true,
            trim: true,
        },
        userEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        contact: {
            type: String,
            required: true,
            trim: true,
        },
        Amount: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);

