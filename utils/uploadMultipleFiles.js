const { v2: cloudinary } = require("cloudinary");
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

const uploadMultipleFiles = async (fileBuffers) => {
    try {
        const maxFileSize = 10 * 1024 * 1024; // 10MB

        const uploadPromises = fileBuffers.map((fileBuffer) => {
            const fileSize = fileBuffer.length;

            if (fileSize > maxFileSize) {
                throw new Error("One of the files exceeds the maximum allowed size (10MB).");
            }

            return new Promise((resolve, reject) => {
                const uploadOptions = { folder: "Tour", resource_type: "auto" };

                cloudinary.uploader
                    .upload_stream(uploadOptions, (error, result) => {
                        if (error) reject(error.message);
                        else resolve(result.secure_url);
                    })
                    .end(fileBuffer);
            });
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        return uploadedUrls;
    } catch (error) {
        throw new Error("Error uploading multiple files.. " + error.message);
    }
};

// Middleware function to handle multiple image uploads
const uploadMultipleImages = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return next();
        }

        const fileBuffers = req.files.map((file) => file.buffer);
        const imageUrls = await uploadMultipleFiles(fileBuffers);
        req.imageUrls = imageUrls;
        next();
    } catch (error) {
        res.status(500).json({ message: "Error uploading images", error: error.message });
    }
};

module.exports = { uploadMultipleFiles, uploadMultipleImages };


