const mongoose = require("mongoose");

const ratingReviewSchema = new mongoose.Schema(
    {
        carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car", index: true, default: null },
        riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, default: null },
        rate: { type: Number, min: 0, max: 5, required: true },
        review: { type: String, default: "" },
    },
    { timestamps: true }
);

ratingReviewSchema.pre("validate", function (next) {
    if (!this.carId && !this.riderId) {
        return next(new Error("Either carId or riderId is required"));
    }
    next();
});

module.exports = mongoose.model("RatingReview", ratingReviewSchema);


