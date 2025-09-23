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
} = require("../controllers/user");
const {auth} = require("../middlewares/auth");

const router = express.Router();
const upload = multer(); // stores files in memory

router.post("/login", login);
router.get("/me", auth, getMe);
router.post("/complete-profile", auth, upload.single("photo"), uploadSingleImage, completeProfile);
router.get("/", getUsers);
router.put("/:id", auth, upload.single("photo"), uploadSingleImage, updateProfile);
router.delete("/:id", deleteUser);

// Role update (protected)
// routes/userRoutes.js
router.put("/:id/role", auth, updateUserRole);


module.exports = router;
