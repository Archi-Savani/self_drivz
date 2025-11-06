const FleetOwnerKyc = require("../models/fleetOwnerKyc");
const { uploadFile } = require("../utils/cloudinary");

// Create or Update FleetOwnerKyc
const createOrUpdateFleetOwnerKyc = async (req, res) => {
    try {
        const {
            ReferCode,
            fullName,
            email,
            acNo,
            ifscCode,
            bankName,
            upiId,
            gpayNumber,
            phonePay,
            pancardNumber,
            gstNum,
        } = req.body;

        // Validate required fields
        if (!fullName || !email || !acNo || !ifscCode || !bankName || !pancardNumber) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Check if files are provided
        if (!req.files || !req.files.passbook || !req.files.panCard) {
            return res.status(400).json({ success: false, message: "passbook and panCard images are required" });
        }

        // Upload images to Cloudinary
        const passbookUrl = await uploadFile(req.files.passbook[0].buffer);
        const panCardUrl = await uploadFile(req.files.panCard[0].buffer);
        
        let gstCertificateUrl = null;
        if (req.files.gstCertificate && req.files.gstCertificate[0]) {
            gstCertificateUrl = await uploadFile(req.files.gstCertificate[0].buffer);
        }

        const payload = {
            ReferCode,
            fullName,
            email,
            acNo,
            ifscCode,
            bankName,
            upiId,
            gpayNumber,
            phonePay,
            passbook: passbookUrl,
            pancardNumber,
            panCard: panCardUrl,
            gstNum,
            gstCertificate: gstCertificateUrl,
            status: "pending",
        };

        // Upsert: if exists, update; otherwise create new (using email as identifier)
        const fleetOwnerKyc = await FleetOwnerKyc.findOneAndUpdate(
            { email: email },
            payload,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ success: true, message: "FleetOwnerKyc submitted successfully", data: fleetOwnerKyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to submit FleetOwnerKyc", error: error.message });
    }
};

// Get my FleetOwnerKyc
const getMyFleetOwnerKyc = async (req, res) => {
    try {
        // Use email from user or query parameter
        const email = req.user?.email || req.query.email;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }
        
        const fleetOwnerKyc = await FleetOwnerKyc.findOne({ email: email });
        if (!fleetOwnerKyc) {
            return res.status(404).json({ success: false, message: "FleetOwnerKyc not found" });
        }
        res.status(200).json({ success: true, data: fleetOwnerKyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch FleetOwnerKyc", error: error.message });
    }
};

// Get all FleetOwnerKycs (Admin only)
const getAllFleetOwnerKycs = async (req, res) => {
    try {
        const fleetOwnerKycs = await FleetOwnerKyc.find()
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: fleetOwnerKycs });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch FleetOwnerKyc list", error: error.message });
    }
};

// Get FleetOwnerKyc by email (Admin only)
const getFleetOwnerKycByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const fleetOwnerKyc = await FleetOwnerKyc.findOne({ email: email });
        if (!fleetOwnerKyc) {
            return res.status(404).json({ success: false, message: "FleetOwnerKyc not found" });
        }
        res.status(200).json({ success: true, data: fleetOwnerKyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch FleetOwnerKyc", error: error.message });
    }
};

// Get FleetOwnerKyc by ID (Admin only)
const getFleetOwnerKycById = async (req, res) => {
    try {
        const { id } = req.params;
        const fleetOwnerKyc = await FleetOwnerKyc.findById(id);
        if (!fleetOwnerKyc) {
            return res.status(404).json({ success: false, message: "FleetOwnerKyc not found" });
        }
        res.status(200).json({ success: true, data: fleetOwnerKyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch FleetOwnerKyc", error: error.message });
    }
};

// Update FleetOwnerKyc status (Admin only)
const updateFleetOwnerKycStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !["pending", "approved", "rejected"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status. Must be pending, approved, or rejected" });
        }

        const update = {
            status,
        };

        const fleetOwnerKyc = await FleetOwnerKyc.findByIdAndUpdate(id, update, { new: true });

        if (!fleetOwnerKyc) {
            return res.status(404).json({ success: false, message: "FleetOwnerKyc not found" });
        }

        res.status(200).json({ success: true, message: "FleetOwnerKyc status updated successfully", data: fleetOwnerKyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update FleetOwnerKyc status", error: error.message });
    }
};

// Approve FleetOwnerKyc by Admin
const approveFleetOwnerKycByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const fleetOwnerKyc = await FleetOwnerKyc.findById(id);
        if (!fleetOwnerKyc) {
            return res.status(404).json({ success: false, message: "FleetOwnerKyc not found" });
        }

        if (fleetOwnerKyc.status === "approved") {
            return res.status(400).json({ success: false, message: "FleetOwnerKyc is already approved" });
        }

        const update = {
            status: "approved",
        };

        const updatedFleetOwnerKyc = await FleetOwnerKyc.findByIdAndUpdate(id, update, { new: true });

        res.status(200).json({ 
            success: true, 
            message: "FleetOwnerKyc approved successfully", 
            data: updatedFleetOwnerKyc 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to approve FleetOwnerKyc", error: error.message });
    }
};

// Update FleetOwnerKyc (user or admin)
const updateFleetOwnerKyc = async (req, res) => {
    try {
        const role = (req.user?.role || "").toString().trim().toLowerCase();
        const isAdmin = role === "admin";

        const {
            ReferCode,
            fullName,
            email,
            acNo,
            ifscCode,
            bankName,
            upiId,
            gpayNumber,
            phonePay,
            pancardNumber,
            gstNum,
            status,
        } = req.body;

        // Determine lookup: admin by :id, user by email
        let existing;
        let query;
        if (req.params.id) {
            // If an ID is provided, use it for lookup for both admin and owner
            existing = await FleetOwnerKyc.findById(req.params.id);
            query = { _id: req.params.id };
        } else {
            const emailToFind = req.user?.email || req.query.email || email;
            if (!emailToFind) {
                return res.status(400).json({ success: false, message: "Email is required" });
            }
            existing = await FleetOwnerKyc.findOne({ email: emailToFind });
            query = { email: emailToFind };
        }

        if (!existing) {
            return res.status(404).json({ success: false, message: "FleetOwnerKyc not found" });
        }

        const updateData = {};
        if (ReferCode !== undefined) updateData.ReferCode = ReferCode;
        if (fullName !== undefined) updateData.fullName = fullName;
        if (email !== undefined && isAdmin) updateData.email = email; // only admin may change email
        if (acNo !== undefined) updateData.acNo = acNo;
        if (ifscCode !== undefined) updateData.ifscCode = ifscCode;
        if (bankName !== undefined) updateData.bankName = bankName;
        if (upiId !== undefined) updateData.upiId = upiId;
        if (gpayNumber !== undefined) updateData.gpayNumber = gpayNumber;
        if (phonePay !== undefined) updateData.phonePay = phonePay;
        if (pancardNumber !== undefined) updateData.pancardNumber = pancardNumber;
        if (gstNum !== undefined) updateData.gstNum = gstNum;

        // Upload new images if provided
        if (req.files && req.files.passbook && req.files.passbook[0]) {
            updateData.passbook = await uploadFile(req.files.passbook[0].buffer);
        }
        if (req.files && req.files.panCard && req.files.panCard[0]) {
            updateData.panCard = await uploadFile(req.files.panCard[0].buffer);
        }
        if (req.files && req.files.gstCertificate && req.files.gstCertificate[0]) {
            updateData.gstCertificate = await uploadFile(req.files.gstCertificate[0].buffer);
        }

        if (Object.keys(updateData).length === 0 && !(isAdmin && status)) {
            return res.status(400).json({ success: false, message: "No data provided to update" });
        }

        if (isAdmin) {
            // Admin can also change status if valid
            if (status && ["pending", "approved", "rejected"].includes(status)) {
                updateData.status = status;
            }
        } else {
            // Non-admin: allow editing at any time; always reset status to pending for re-approval
            updateData.status = "pending";
        }

        const updated = await FleetOwnerKyc.findOneAndUpdate(query, updateData, { new: true });
        return res.status(200).json({ success: true, message: "FleetOwnerKyc updated successfully", data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update FleetOwnerKyc", error: error.message });
    }
};

// Delete FleetOwnerKyc (Admin only)
const deleteFleetOwnerKyc = async (req, res) => {
    try {
        const { id } = req.params;
        const fleetOwnerKyc = await FleetOwnerKyc.findByIdAndDelete(id);
        if (!fleetOwnerKyc) {
            return res.status(404).json({ success: false, message: "FleetOwnerKyc not found" });
        }
        res.status(200).json({ success: true, message: "FleetOwnerKyc deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete FleetOwnerKyc", error: error.message });
    }
};

module.exports = {
    createOrUpdateFleetOwnerKyc,
    getMyFleetOwnerKyc,
    getAllFleetOwnerKycs,
    getFleetOwnerKycByEmail,
    getFleetOwnerKycById,
    updateFleetOwnerKycStatus,
    approveFleetOwnerKycByAdmin,
    updateFleetOwnerKyc,
    deleteFleetOwnerKyc,
};

