const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema(
    {
        mode: { type: String, enum: ["live", "manual"], required: true },
        live: {
            type: new mongoose.Schema(
                {
                    latitude: { type: Number, required: true },
                    longitude: { type: Number, required: true },
                    accuracyMeters: { type: Number, default: 0 },
                },
                { _id: false }
            ),
            default: null,
        },
        manual: {
            type: new mongoose.Schema(
                {
                    addressLine1: { type: String, required: true },
                    addressLine2: { type: String, default: null },
                    city: { type: String, required: true },
                    state: { type: String, required: true },
                    country: { type: String, required: true },
                    postalCode: { type: String, required: true },
                },
                { _id: false }
            ),
            default: null,
        },
    },
    { _id: false }
);

const DateRangeSchema = new mongoose.Schema(
    {
        from: { type: String, required: true }, // ISO date YYYY-MM-DD
        to: { type: String, required: true },
    },
    { _id: false }
);

const TimeRangeSchema = new mongoose.Schema(
    {
        from: { type: String, required: true }, // HH:MM 24h
        to: { type: String, required: true },
    },
    { _id: false }
);

const RideSchema = new mongoose.Schema(
    {
        location: { type: LocationSchema, required: true },
        date: { type: DateRangeSchema, required: true },
        time: { type: TimeRangeSchema, required: true },
        status: { type: String, enum: ["pending", "approve", "reject"], default: "pending" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Ride", RideSchema);


