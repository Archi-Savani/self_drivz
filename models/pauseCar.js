const mongoose = require("mongoose");

const dateRangeSchema = new mongoose.Schema(
    {
        from: { type: Date, required: true },
        to: { type: Date, required: true },
    },
    { _id: false }
);

const timeRangeSchema = new mongoose.Schema(
    {
        from: { type: String, required: true }, // HH:mm
        to: { type: String, required: true },
    },
    { _id: false }
);

const pauseCarSchema = new mongoose.Schema(
    {
        carId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Car",
            required: true,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        date: {
            type: dateRangeSchema,
            required: true,
        },
        time: {
            type: timeRangeSchema,
            required: true,
        },
        additionalNote: {
            type: String,
            trim: true,
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

pauseCarSchema.path("date").validate(function(value) {
    if (!value?.from || !value?.to) return false;
    return value.from <= value.to;
}, "date.from must be before or equal to date.to");

pauseCarSchema.path("time").validate(function(value) {
    if (!value?.from || !value?.to) return false;
    return value.from < value.to;
}, "time.from must be before time.to");

module.exports = mongoose.model("PauseCar", pauseCarSchema);

