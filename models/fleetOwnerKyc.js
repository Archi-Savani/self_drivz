const mongoose = require("mongoose");

const fleetOwnerKycSchema = new mongoose.Schema(
    {
        ReferCode: { type: String },
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        acNo: { type: String, required: true },
        ifscCode: { type: String, required: true },
        bankName: { type: String, required: true },
        upiId: { type: String },
        gpayNumber: { type: String },
        phonePay: { type: String },
        passbook: { type: String, required: true }, // Cloudinary URL
        pancardNumber: { type: String, required: true },
        panCard: { type: String, required: true }, // Cloudinary URL
        gstNum: { type: String },
        gstCertificate: { type: String }, // Cloudinary URL
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("FleetOwnerKyc", fleetOwnerKycSchema);

