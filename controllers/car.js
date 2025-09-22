// controllers/carController.js
const Car = require("../models/Car");
const { uploadMultipleFiles } = require("../utils/uploadMultipleFiles"); // your cloudinary function

// Add Car - Only FleetOwner (role != Rider)
const addCar = async (req, res) => {
    try {
        if (req.user.role === "Rider") {
            return res.status(403).json({ success: false, message: "Only FleetOwner can add cars" });
        }

        const { name, category, hourlyRate, kmPerHour, transmission, fuel } = req.body;

        if (!name || !category || !hourlyRate || !kmPerHour || !transmission || !fuel) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Upload images
        let carImages = [];
        if (req.files && req.files.carImages) {
            const fileBuffers = req.files.carImages.map(f => f.buffer);
            carImages = await uploadMultipleFiles(fileBuffers);
        }

        // Upload video
        let videoUrl = "";
        if (req.files && req.files.video && req.files.video[0]) {
            const fileBuffer = req.files.video[0].buffer;
            const [uploadedVideo] = await uploadMultipleFiles([fileBuffer]);
            videoUrl = uploadedVideo;
        }

        const newCar = new Car({
            name,
            category,
            hourlyRate,
            kmPerHour,
            transmission,
            fuel,
            carImages,
            video: videoUrl,
            status: "Pending", // default
        });

        await newCar.save();

        res.status(201).json({
            success: true,
            message: "Car added successfully and pending approval",
            data: newCar,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add car", error: error.message });
    }
};

// Get all cars
const getCars = async (req, res) => {
    try {
        const cars = await Car.find();
        res.status(200).json({ success: true, data: cars });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch cars", error: error.message });
    }
};

// Get single car by ID
const getCarById = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ success: false, message: "Car not found" });
        res.status(200).json({ success: true, data: car });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch car", error: error.message });
    }
};

// Update car - Only FleetOwner, cannot edit status
const updateCar = async (req, res) => {
    try {
        if (req.user.role === "Rider") {
            return res.status(403).json({ success: false, message: "Only FleetOwner can update cars" });
        }

        const { category, hourlyRate, kmPerHour, transmission, fuel } = req.body;
        const updatedData = { category, hourlyRate, kmPerHour, transmission, fuel };

        // Upload new images if provided
        if (req.files && req.files.carImages) {
            const fileBuffers = req.files.carImages.map(f => f.buffer);
            updatedData.carImages = await uploadMultipleFiles(fileBuffers);
        }

        // Upload new video if provided
        if (req.files && req.files.video && req.files.video[0]) {
            const fileBuffer = req.files.video[0].buffer;
            const [uploadedVideo] = await uploadMultipleFiles([fileBuffer]);
            updatedData.video = uploadedVideo;
        }

        const car = await Car.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        if (!car) return res.status(404).json({ success: false, message: "Car not found" });

        res.status(200).json({ success: true, message: "Car updated successfully", data: car });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update car", error: error.message });
    }
};

// Delete car - FleetOwner only
const deleteCar = async (req, res) => {
    try {
        if (req.user.role === "Rider") {
            return res.status(403).json({ success: false, message: "Only FleetOwner can delete cars" });
        }

        const car = await Car.findByIdAndDelete(req.params.id);
        if (!car) return res.status(404).json({ success: false, message: "Car not found" });

        res.status(200).json({ success: true, message: "Car deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete car", error: error.message });
    }
};

// Approve car - Admin only
const approveCar = async (req, res) => {
    try {
        if (req.user.role !== "Admin") {
            return res.status(403).json({ success: false, message: "Only admin can approve cars" });
        }

        const car = await Car.findByIdAndUpdate(req.params.id, { status: "Approved" }, { new: true });
        if (!car) return res.status(404).json({ success: false, message: "Car not found" });

        res.status(200).json({ success: true, message: "Car approved successfully", data: car });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to approve car", error: error.message });
    }
};

module.exports = {
    addCar,
    getCars,
    getCarById,
    updateCar,
    deleteCar,
    approveCar,
};
