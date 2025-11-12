const multer = require("multer");

// Use memory storage (file stored in buffer)
const storage = multer.memoryStorage();

// File filter: allow images and videos
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image and video files are allowed!"), false);
    }
};

// Multer upload middleware
const upload = multer({
    storage,
    limits: { 
        fileSize: 100 * 1024 * 1024 // 100MB limit (videos are larger than images)
    },
    fileFilter,
});

module.exports = upload;
