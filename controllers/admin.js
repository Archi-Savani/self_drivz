const Admin = require("../models/admin");
const jwt = require("jsonwebtoken");

// Admin Registration
const registerAdmin = async (req, res) => {
    try {
        const { userName, email, password } = req.body;

        // Validate required fields
        if (!userName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "userName, email, and password are required",
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        // Check if admin with email already exists
        const existingAdminByEmail = await Admin.findOne({ email: email.toLowerCase() });
        if (existingAdminByEmail) {
            return res.status(400).json({
                success: false,
                message: "Admin with this email already exists",
            });
        }

        // Check if admin with userName already exists
        const existingAdminByUserName = await Admin.findOne({ userName });
        if (existingAdminByUserName) {
            return res.status(400).json({
                success: false,
                message: "Admin with this userName already exists",
            });
        }

        // Create new admin (password will be hashed by pre-save hook, role is fixed to "admin")
        const admin = await Admin.create({
            userName,
            email: email.toLowerCase(),
            password,
            role: "admin", // Fixed role
        });

        // Remove password from response
        const adminResponse = admin.toObject();
        delete adminResponse.password;

        res.status(201).json({
            success: true,
            message: "Admin registered successfully",
            data: adminResponse,
        });
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists`,
            });
        }
        res.status(500).json({
            success: false,
            message: "Failed to register admin",
            error: error.message,
        });
    }
};

// Admin Login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // Find admin by email
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Compare password
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email,
                userName: admin.userName,
                role: admin.role || "admin", // Use admin.role from database
            },
            process.env.JWT_SECRET || "dev_secret",
            { expiresIn: "7d" }
        );

        // Remove password from response
        const adminResponse = admin.toObject();
        delete adminResponse.password;

        res.status(200).json({
            success: true,
            message: "Admin logged in successfully",
            token,
            data: adminResponse,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to login admin",
            error: error.message,
        });
    }
};

// Get Admin Profile (protected route)
const getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id).select("-password");
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        res.status(200).json({
            success: true,
            data: admin,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch admin profile",
            error: error.message,
        });
    }
};

module.exports = {
    registerAdmin,
    loginAdmin,
    getAdminProfile,
};

