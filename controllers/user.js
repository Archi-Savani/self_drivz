const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Login with phone
const login = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ success: false, message: "Phone is required" });

        let user = await User.findOne({ phone });
        if (!user) user = await User.create({ phone });

        // Include phone in JWT
        const token = jwt.sign(
            { id: user._id, role: user.role, phone: user.phone },
            process.env.JWT_SECRET || "dev_secret",
            { expiresIn: "7d" }
        );

        res.status(200).json({ success: true, token, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Complete profile (for logged-in user, phone is from login, not editable)
const completeProfile = async (req, res) => {
    try {
        const { name, email, addBio, role, photo } = req.body;

        if (!req.user || !req.user.phone) {
            return res.status(401).json({ success: false, message: "Unauthorized: Phone missing" });
        }

        // Build updated profile data
        const updatedData = {
            name,
            email,
            addBio,
            role, // optional: Rider/FleetOwner or any other role
            phone: req.user.phone, // always from login
        };

        // If photo is uploaded via middleware
        if (req.imageUrl) updatedData.photo = req.imageUrl;
        else if (photo) updatedData.photo = photo; // optional direct photo field

        const user = await User.findByIdAndUpdate(req.user.id, updatedData, { new: true });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "Profile completed successfully",
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to complete profile",
            error: error.message,
        });
    }
};

// Get all users
const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch users", error: error.message });
    }
};

// Get logged-in user (using auth middleware)
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch user profile",
            error: error.message,
        });
    }
};

// Update user role
const updateUserRole = async (req, res) => {
    try {
        const { isRider } = req.body;
        if (typeof isRider !== "boolean") {
            return res.status(400).json({ success: false, message: "isRider must be true or false" });
        }

        const updatedRole = isRider ? "Rider" : "FleetOwner";
        const user = await User.findByIdAndUpdate(req.user.id, { role: updatedRole }, { new: true });

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({
            success: true,
            message: `User role updated to ${updatedRole}`,
            data: user,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update user role", error: error.message });
    }
};

// Delete user (admin only or by ID if needed)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete user", error: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Extract only fields that can be updated
        const { email, addBio, role, photo } = req.body;

        const updatedData = {
            email,
            addBio,
            role, // optional: can update role if allowed
        };

        // If photo uploaded via middleware
        if (req.imageUrl) updatedData.photo = req.imageUrl;
        else if (photo) updatedData.photo = photo; // optional direct photo field

        // Always keep name and phone from login
        const user = await User.findByIdAndUpdate(req.user.id, updatedData, { new: true });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: error.message,
        });
    }
};

module.exports = {
    login,
    completeProfile,
    getUsers,
    getMe,
    updateUserRole,
    deleteUser,
    updateProfile,
};
