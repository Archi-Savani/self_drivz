const mongoose = require("mongoose");

const termsSchema = new mongoose.Schema(
    {
        content: { type: String, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("TermsAndConditions", termsSchema);


