const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true, unique: true },
        selfie: { type: String, required: true },
        aadharFront: { type: String, required: true },
        aadharBack: { type: String, required: true },
        drivingLicenseFront: { type: String, required: true },
        drivingLicenseBack: { type: String, required: true },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", required: true },
        adminNote: { type: String },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reviewedAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Kyc", kycSchema);


