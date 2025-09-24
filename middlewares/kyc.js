const Kyc = require("../models/kyc");

const ensureApprovedKyc = async (req, res, next) => {
    try {
        const role = req.user?.role?.toLowerCase?.();
        if (!role) return res.status(401).json({ success: false, message: "Unauthorized" });

        const kyc = await Kyc.findOne({ user: req.user._id });
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


