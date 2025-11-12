const express = require("express");
const router = express.Router();
const { registerAdmin, loginAdmin, getAdminProfile } = require("../controllers/admin");
const { auth } = require("../middlewares/auth");

// Public routes
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

// Protected routes (require authentication)
router.get("/me", auth, getAdminProfile);

module.exports = router;

