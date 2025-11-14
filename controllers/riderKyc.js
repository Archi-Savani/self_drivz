const RiderKyc = require("../models/riderKyc");
const { uploadFile } = require("../utils/cloudinary");

// Create or Update RiderKyc
const createOrUpdateRiderKyc = async (req, res) => {
    try {
        const {
            fullName,
            email,
            referCode,
        } = req.body;

        // Validate required fields
        if (!fullName || !email) {
            return res.status(400).json({ success: false, message: "fullName and email are required" });
        }

        // Check if files are provided
        if (!req.files) {
            return res.status(400).json({ success: false, message: "Files are required" });
        }

        const requiredFields = ["selfie", "aadharFront", "aadharBack", "drivingLicenseFront", "drivingLicenseBack"];

        for (const field of requiredFields) {
            if (!req.files[field] || !req.files[field][0]) {
                return res.status(400).json({ success: false, message: `${field} image is required` });
            }
        }

        // Upload images to Cloudinary
        const selfieUrl = await uploadFile(req.files.selfie[0].buffer);
        const aadharFrontUrl = await uploadFile(req.files.aadharFront[0].buffer);
        const aadharBackUrl = await uploadFile(req.files.aadharBack[0].buffer);
        const drivingLicenseFrontUrl = await uploadFile(req.files.drivingLicenseFront[0].buffer);
        const drivingLicenseBackUrl = await uploadFile(req.files.drivingLicenseBack[0].buffer);

        const payload = {
            fullName,
            email,
            referCode,
            selfie: selfieUrl,
            aadharFront: aadharFrontUrl,
            aadharBack: aadharBackUrl,
            drivingLicenseFront: drivingLicenseFrontUrl,
            drivingLicenseBack: drivingLicenseBackUrl,
            status: "pending",
        };

        // Upsert: if exists, update; otherwise create new (using email as identifier)
        const riderKyc = await RiderKyc.findOneAndUpdate(
            { email: email },
            payload,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ success: true, message: "RiderKyc submitted successfully", data: riderKyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to submit RiderKyc", error: error.message });
    }
};

// Get my RiderKyc
const getMyRiderKyc = async (req, res) => {
    try {
        // Use email from user or query parameter
        const email = req.user?.email || req.query.email;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }
        
        const riderKyc = await RiderKyc.findOne({ email: email });
        if (!riderKyc) {
            return res.status(404).json({ success: false, message: "RiderKyc not found" });
        }
        res.status(200).json({ success: true, data: riderKyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch RiderKyc", error: error.message });
    }
};

// Get all RiderKycs (Admin only)
const getAllRiderKycs = async (req, res) => {
    try {
        const riderKycs = await RiderKyc.find()
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: riderKycs });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch RiderKyc list", error: error.message });
    }
};

// Get RiderKyc by email (Admin only)
const getRiderKycByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const riderKyc = await RiderKyc.findOne({ email: email });
        if (!riderKyc) {
            return res.status(404).json({ success: false, message: "RiderKyc not found" });
        }
        res.status(200).json({ success: true, data: riderKyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch RiderKyc", error: error.message });
    }
};

// Get RiderKyc by ID (Admin only)
const getRiderKycById = async (req, res) => {
    try {
        const { id } = req.params;
        const riderKyc = await RiderKyc.findById(id);
        if (!riderKyc) {
            return res.status(404).json({ success: false, message: "RiderKyc not found" });
        }
        res.status(200).json({ success: true, data: riderKyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch RiderKyc", error: error.message });
    }
};

// Update RiderKyc status (Admin only)
const updateRiderKycStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !["pending", "approved", "rejected", "block"].includes(status.toLowerCase())) {
            return res.status(400).json({ success: false, message: "Invalid status. Must be pending, approved, rejected, or block" });
        }

        const update = {
            status: status.toLowerCase(),
        };

        const riderKyc = await RiderKyc.findByIdAndUpdate(id, update, { new: true });

        if (!riderKyc) {
            return res.status(404).json({ success: false, message: "RiderKyc not found" });
        }

        res.status(200).json({ success: true, message: "RiderKyc status updated successfully", data: riderKyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update RiderKyc status", error: error.message });
    }
};

// Approve RiderKyc by Admin
const approveRiderKycByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const riderKyc = await RiderKyc.findById(id);
        if (!riderKyc) {
            return res.status(404).json({ success: false, message: "RiderKyc not found" });
        }

        if (riderKyc.status === "approved") {
            return res.status(400).json({ success: false, message: "RiderKyc is already approved" });
        }

        const update = {
            status: "approved",
        };

        const updatedRiderKyc = await RiderKyc.findByIdAndUpdate(id, update, { new: true });

        res.status(200).json({ 
            success: true, 
            message: "RiderKyc approved successfully", 
            data: updatedRiderKyc 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to approve RiderKyc", error: error.message });
    }
};

// Update RiderKyc (by user)
const updateRiderKyc = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fullName,
            email,
            referCode,
        } = req.body;

        let existingRiderKyc;
        let updateQuery;

        // If id is "me", find by email from user or body
        if (id === "me") {
            const emailToFind = req.user?.email || req.query.email || email;
            if (!emailToFind) {
                return res.status(400).json({ success: false, message: "Email is required" });
            }
            existingRiderKyc = await RiderKyc.findOne({ email: emailToFind });
            updateQuery = { email: emailToFind };
        } else {
            // Use ID from params
            if (!id) {
                return res.status(400).json({ success: false, message: "ID is required" });
            }
            existingRiderKyc = await RiderKyc.findById(id);
            updateQuery = { _id: id };
        }

        if (!existingRiderKyc) {
            return res.status(404).json({ success: false, message: "RiderKyc not found" });
        }

        // Role-based behavior
        const role = req.user?.role?.toLowerCase?.();
        const isAdmin = role === "admin";
        const isApproved = existingRiderKyc.status === "approved";

        const updateData = {};
        if (fullName !== undefined && fullName !== null && fullName !== "") {
            updateData.fullName = fullName;
        }
        if (email !== undefined && email !== null && email !== "" && id !== "me") {
            // Only update email if not using /me route
            updateData.email = email;
        }
        if (referCode !== undefined) {
            updateData.referCode = referCode;
        }

        // Upload new images if provided
        if (req.files && req.files.selfie && req.files.selfie[0]) {
            updateData.selfie = await uploadFile(req.files.selfie[0].buffer);
        }
        if (req.files && req.files.aadharFront && req.files.aadharFront[0]) {
            updateData.aadharFront = await uploadFile(req.files.aadharFront[0].buffer);
        }
        if (req.files && req.files.aadharBack && req.files.aadharBack[0]) {
            updateData.aadharBack = await uploadFile(req.files.aadharBack[0].buffer);
        }
        if (req.files && req.files.drivingLicenseFront && req.files.drivingLicenseFront[0]) {
            updateData.drivingLicenseFront = await uploadFile(req.files.drivingLicenseFront[0].buffer);
        }
        if (req.files && req.files.drivingLicenseBack && req.files.drivingLicenseBack[0]) {
            updateData.drivingLicenseBack = await uploadFile(req.files.drivingLicenseBack[0].buffer);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: "No data provided to update" });
        }

        if (isAdmin) {
            // Admins can update any fields; keep status as provided or unchanged
            if (req.body.status && ["pending", "approved", "rejected", "block"].includes(req.body.status.toLowerCase())) {
                updateData.status = req.body.status.toLowerCase();
            }
        } else {
            if (isApproved) {
                // Non-admins: only allow referCode when approved
                const allowedWhenApproved = ["referCode"];
                const invalidKeys = Object.keys(updateData).filter((k) => !allowedWhenApproved.includes(k));
                if (invalidKeys.length > 0) {
                    return res.status(403).json({ success: false, message: "RiderKyc is approved; only referCode can be updated" });
                }
            } else {
                // Non-admins: For pending/rejected, reset status to pending on any update
                updateData.status = "pending";
            }
        }

        const riderKyc = id === "me"
            ? await RiderKyc.findOneAndUpdate(updateQuery, updateData, { new: true })
            : await RiderKyc.findByIdAndUpdate(id, updateData, { new: true });

        if (!riderKyc) {
            return res.status(404).json({ success: false, message: "RiderKyc not found" });
        }

        res.status(200).json({ success: true, message: "RiderKyc updated successfully", data: riderKyc });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update RiderKyc", error: error.message });
    }
};

// Delete RiderKyc (Admin only)
const deleteRiderKyc = async (req, res) => {
    try {
        const { id } = req.params;
        const riderKyc = await RiderKyc.findByIdAndDelete(id);
        if (!riderKyc) {
            return res.status(404).json({ success: false, message: "RiderKyc not found" });
        }
        res.status(200).json({ success: true, message: "RiderKyc deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete RiderKyc", error: error.message });
    }
};

module.exports = {
    createOrUpdateRiderKyc,
    getMyRiderKyc,
    getAllRiderKycs,
    getRiderKycByEmail,
    getRiderKycById,
    updateRiderKycStatus,
    approveRiderKycByAdmin,
    updateRiderKyc,
    deleteRiderKyc,
};

