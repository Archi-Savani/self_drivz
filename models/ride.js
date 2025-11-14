const mongoose = require("mongoose");

const LocationPointSchema = new mongoose.Schema(
    {
        longitude: { type: Number, required: true },
        latitude: { type: Number, required: true },
    },
    { _id: false }
);

const LocationSchema = new mongoose.Schema(
    {
        from: { type: LocationPointSchema, required: true },
        to: { type: LocationPointSchema, required: true },
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
        carId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Car",
            required: true,
        },
        location: { type: LocationSchema, required: true },
        date: { type: DateRangeSchema, required: true },
        time: { type: TimeRangeSchema, required: true },
        status: { type: String, enum: ["pending", "approve", "reject", "ongoing"], default: "pending", lowercase: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Ride", RideSchema);


