const mongoose = require("mongoose");

const adventureSchema = new mongoose.Schema(
    {
        fleetby: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        carModel: { type: String, required: true, trim: true },
        year: { type: Number, required: true },
        location: { type: String, required: true, trim: true },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        trips: { type: Number, default: 0, min: 0 },
        ridername: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        feedback: { type: String, trim: true },
        image: { type: String, required: true }, // Cloudinary URL (single image)
    },
    { timestamps: true }
);

module.exports = mongoose.model("Adventure", adventureSchema);



