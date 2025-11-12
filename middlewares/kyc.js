const RiderKyc = require("../models/riderKyc");
const FleetOwnerKyc = require("../models/fleetOwnerKyc");

const ensureApprovedKyc = async (req, res, next) => {
    try {
        const role = req.user?.role?.toLowerCase?.();
        if (!role) return res.status(401).json({ success: false, message: "Unauthorized" });

        const userEmail = req.user?.email;
        if (!userEmail) {
            return res.status(401).json({ success: false, message: "User email not found" });
        }

        let kyc = null;

        // Check the appropriate KYC model based on user role
        // Handle both "Rider"/"rider" and "FleetOwner"/"fleetowner" variations
        // Use case-insensitive email matching by converting to lowercase
        const emailLower = userEmail.toLowerCase().trim();
        if (role === "rider") {
            kyc = await RiderKyc.findOne({ email: { $regex: new RegExp(`^${emailLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } });
        } else if (role === "fleetowner" || role === "fleet owner") {
            kyc = await FleetOwnerKyc.findOne({ email: { $regex: new RegExp(`^${emailLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } });
        } else {
            // For admin or other roles, skip KYC check
            return next();
        }

        if (!kyc) {
            return res.status(403).json({ success: false, message: "KYC required. Please submit your KYC first." });
        }
        
        if (kyc.status !== "approved") {
            return res.status(403).json({ success: false, message: `KYC is ${kyc.status}. Access denied until approved.` });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: "KYC check failed", error: error.message });
    }
};

module.exports = { ensureApprovedKyc };


