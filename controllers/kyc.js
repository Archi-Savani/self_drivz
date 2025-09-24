const Kyc = require("../models/kyc");
const { uploadMultipleFiles } = require("../utils/cloudinary");

// Submit or resubmit KYC (Rider and FleetOwner)
const submitKyc = async (req, res) => {
    try {
        const role = req.user?.role?.toLowerCase?.();
        if (!role || !["rider", "fleetowner"].includes(role)) {
            return res.status(403).json({ success: false, message: "Only Riders or Fleet Owners can submit KYC" });
        }

        if (!req.files) {
            return res.status(400).json({ success: false, message: "Files are required" });
        }

        const requiredFields = ["selfie", "aadharFront", "aadharBack", "drivingLicenseFront", "drivingLicenseBack"];

        for (const field of requiredFields) {
            if (!req.files[field] || !req.files[field][0]) {
                return res.status(400).json({ success: false, message: `${field} file is required` });
            }
        }

        // Upload to cloudinary
        const [selfieUrl] = await uploadMultipleFiles([req.files.selfie[0].buffer]);
        const [aadharFrontUrl] = await uploadMultipleFiles([req.files.aadharFront[0].buffer]);
        const [aadharBackUrl] = await uploadMultipleFiles([req.files.aadharBack[0].buffer]);
        const [dlFrontUrl] = await uploadMultipleFiles([req.files.drivingLicenseFront[0].buffer]);
        const [dlBackUrl] = await uploadMultipleFiles([req.files.drivingLicenseBack[0].buffer]);

        const payload = {
            user: req.user._id,
            selfie: selfieUrl,
            aadharFront: aadharFrontUrl,
            aadharBack: aadharBackUrl,
            drivingLicenseFront: dlFrontUrl,
            drivingLicenseBack: dlBackUrl,
            status: "pending",
        };

        // Upsert: if exists, overwrite and set status back to pending
        const kyc = await Kyc.findOneAndUpdate({ user: req.user._id }, payload, { new: true, upsert: true, setDefaultsOnInsert: true });

        res.status(200).json({ success: true, message: "KYC submitted successfully", data: kyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to submit KYC", error: error.message });
    }
};

// Admin: list all KYC submissions
const listKycs = async (req, res) => {
    try {
        const kycs = await Kyc.find().populate("user", "name phone email role").sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: kycs });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch KYC list", error: error.message });
    }
};

// Admin: get single KYC by user id
const getKycByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const kyc = await Kyc.findOne({ user: userId }).populate("user", "name phone email role");
        if (!kyc) return res.status(404).json({ success: false, message: "KYC not found" });
        res.status(200).json({ success: true, data: kyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch KYC", error: error.message });
    }
};

// Admin: update KYC status
const updateKycStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, adminNote } = req.body;

        if (!status || !["pending", "approved", "rejected"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const update = {
            status,
            adminNote,
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
        };

        const kyc = await Kyc.findOneAndUpdate({ user: userId }, update, { new: true });
        if (!kyc) return res.status(404).json({ success: false, message: "KYC not found" });

        res.status(200).json({ success: true, message: "KYC status updated", data: kyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update KYC", error: error.message });
    }
};

// Rider/Admin: my KYC
const getMyKyc = async (req, res) => {
    try {
        const kyc = await Kyc.findOne({ user: req.user._id });
        if (!kyc) return res.status(404).json({ success: false, message: "KYC not found" });
        res.status(200).json({ success: true, data: kyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch KYC", error: error.message });
    }
};

module.exports = { submitKyc, listKycs, getKycByUser, updateKycStatus, getMyKyc };


