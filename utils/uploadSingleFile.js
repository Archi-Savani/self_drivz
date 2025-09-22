const { v2: cloudinary } = require("cloudinary");
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const uploadFile = async (fileBuffer) => {
    try {
        const fileSize = fileBuffer.length;
        const maxFileSize = 10 * 1024 * 1024; // 10MB

        if (fileSize > maxFileSize) {
            throw new Error("File size exceeds the maximum allowed limit.");
        }

        return new Promise((resolve, reject) => {
            const uploadOptions = {
                folder: "State",
                resource_type: "auto",
            };

            cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) {
                    reject(error.message);
                } else {
                    resolve(result.secure_url);
                }
            }).end(fileBuffer);
        });
    } catch (error) {
        console.error(error.message);
        throw new Error("Error uploading file..");
    }
};

// Middleware function to handle single image upload
const uploadSingleImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }

        const imageUrl = await uploadFile(req.file.buffer);
        req.imageUrl = imageUrl;
        next();
    } catch (error) {
        res.status(500).json({ message: "Error uploading image", error: error.message });
    }
};

module.exports = { uploadFile, uploadSingleImage };


