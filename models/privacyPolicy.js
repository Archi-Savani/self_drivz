const mongoose = require("mongoose");

const privacyPolicySchema = new mongoose.Schema(
    {
        content: { type: String, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("PrivacyPolicy", privacyPolicySchema);


