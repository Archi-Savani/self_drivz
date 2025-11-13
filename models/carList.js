const mongoose = require("mongoose");

const rentalPeriodSchema = new mongoose.Schema(
    {
        from: {
            type: Date,
            required: true,
        },
        to: {
            type: Date,
            required: true,
        },
    },
    { _id: false }
);

const carListSchema = new mongoose.Schema(
    {
        city: {
            type: String,
            required: true,
            trim: true,
        },
        parkingLocation: {
            type: String,
            required: true,
            trim: true,
        },
        car: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Car",
            required: true,
        },
        pricePerDay: {
            type: Number,
            required: true,
            min: 0,
        },
        rentalPeriod: {
            type: rentalPeriodSchema,
            required: true,
        },
        deliveryAvailable: {
            type: Boolean,
            default: false,
        },
        fleetBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        ApprovePricePerDay: {
            type: Number,
            min: 0,
        },
    },
    { timestamps: true }
);

carListSchema.path("rentalPeriod").validate(function(value) {
    if (!value || !value.from || !value.to) return false;
    return value.from <= value.to;
}, "rentalPeriod.from must be less than or equal to rentalPeriod.to");

module.exports = mongoose.model("CarList", carListSchema);

