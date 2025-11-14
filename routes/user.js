const express = require("express");
const multer = require("multer");
const { uploadSingleImage } = require("../utils/uploadSingleFile");
const {
    completeProfile,
    getUsers,
    // getUserById,
    updateProfile,
    deleteUser,
    login,
    updateUserRole,
    getMe,
    updateUserStatus,
} = require("../controllers/user");
const {auth, requireAdmin} = require("../middlewares/auth");

const router = express.Router();
const upload = multer(); // stores files in memory

router.post("/login", login);
router.get("/me", auth, getMe);
router.post("/complete-profile", auth, upload.single("photo"), uploadSingleImage, completeProfile);
router.get("/", auth, getUsers);
router.put("/:id", auth, upload.single("photo"), uploadSingleImage, updateProfile);
router.delete("/:id", auth, requireAdmin, deleteUser);

// Role update (protected)
router.put("/:id/role", auth, updateUserRole);

// Admin only: Update user status (approve, reject, block)
router.put("/:id/status", auth, requireAdmin, updateUserStatus);


module.exports = router;
