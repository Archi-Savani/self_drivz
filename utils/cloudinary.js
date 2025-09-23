// utils/cloudinary.js
const { v2: cloudinary } = require("cloudinary");
const streamifier = require("streamifier");
const dotenv = require("dotenv");

dotenv.config();

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

// Upload a single file (image or video) to Cloudinary
const uploadFile = (fileBuffer, resourceType = "auto") => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType, // auto = image/video/pdf/etc
                folder: "uploads", // optional: all uploads inside folder "uploads"
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

// Upload multiple files
const uploadMultipleFiles = async (fileBuffers, resourceType = "auto") => {
    try {
        const uploadPromises = fileBuffers.map((fileBuffer) =>
            uploadFile(fileBuffer, resourceType)
        );
        return await Promise.all(uploadPromises);
    } catch (error) {
        throw new Error("Cloudinary upload failed: " + error.message);
    }
};

module.exports = { uploadFile, uploadMultipleFiles };
