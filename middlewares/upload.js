const multer = require("multer");

// Use memory storage (file stored in buffer)
const storage = multer.memoryStorage();

// File filter (optional: restrict only images)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};

// Multer upload middleware
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter,
});

module.exports = upload;
