const mongoose = require("mongoose");

const riderKycSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        referCode: { type: String },
        selfie: { type: String, required: true }, // Cloudinary URL
        aadharFront: { type: String, required: true }, // Cloudinary URL
        aadharBack: { type: String, required: true }, // Cloudinary URL
        drivingLicenseFront: { type: String, required: true }, // Cloudinary URL
        drivingLicenseBack: { type: String, required: true }, // Cloudinary URL
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("RiderKyc", riderKycSchema);


