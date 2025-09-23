const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");

        // Verify user exists
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ success: false, message: "Unauthorized: User not found" });

        req.user = user

        next();
    } catch (error) {
        res.status(401).json({ success: false, message: "Unauthorized", error: error.message });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Forbidden: admin only" });
    }
    next();
};

module.exports = {auth, requireAdmin};
