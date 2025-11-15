const Car = require("../models/car");
const mongoose = require("mongoose");
const User = require("../models/user");
const { uploadFile, uploadMultipleFiles } = require("../utils/cloudinary");

// Add Car - Only FleetOwner and Admin (not Rider)
const addCar = async (req, res) => {
    try {
        const role = (req.user?.role || "").toString().trim().toLowerCase();
        if (role === "rider") {
            return res.status(403).json({ success: false, message: "Riders cannot add cars. Only FleetOwner and Admin can add cars." });
        }

        const {
            carName,
            brand,
            model,
            year,
            color,
            RegNo,
            transmission,
            fuelType,
            seating,
            pricePerDay,
            UnitsAvailable,
            dec,
            variant,
            features,
            fleetBy, // only honored when admin adds
        } = req.body;

        // Validate required fields
        if (!carName || !brand || !model || !year || !color || !RegNo || !transmission || !fuelType || !seating || !pricePerDay) {
            return res.status(400).json({ success: false, message: "carName, brand, model, year, color, RegNo, transmission, fuelType, seating, pricePerDay are required" });
        }

        // Validate car images (min 5, max 10)
        if (!req.files || !req.files.carImage || req.files.carImage.length < 5 || req.files.carImage.length > 10) {
            return res.status(400).json({ success: false, message: "carImage must have between 5 and 10 images" });
        }

        // Validate required document images
        if (!req.files.insurance || !req.files.insurance[0]) {
            return res.status(400).json({ success: false, message: "insurance image is required" });
        }
        if (!req.files.pollution || !req.files.pollution[0]) {
            return res.status(400).json({ success: false, message: "pollution image is required" });
        }
        if (!req.files.tacToken || !req.files.tacToken[0]) {
            return res.status(400).json({ success: false, message: "tacToken image is required" });
        }
        if (!req.files.rcBook || !req.files.rcBook[0]) {
            return res.status(400).json({ success: false, message: "rcBook image is required" });
        }

        // Upload car images (5-10)
        const carImageBuffers = req.files.carImage.map(f => f.buffer);
        const carImages = await uploadMultipleFiles(carImageBuffers);

        // Upload video (optional)
        let videoUrl = null;
        if (req.files.video && req.files.video[0]) {
            videoUrl = await uploadFile(req.files.video[0].buffer, "video");
        }

        // Upload document images
        const insuranceUrl = await uploadFile(req.files.insurance[0].buffer);
        const pollutionUrl = await uploadFile(req.files.pollution[0].buffer);
        const tacTokenUrl = await uploadFile(req.files.tacToken[0].buffer);
        const rcBookUrl = await uploadFile(req.files.rcBook[0].buffer);

        const newCar = new Car({
            carName,
            brand,
            model,
            year: parseInt(year),
            color,
            RegNo: RegNo.toUpperCase(),
            transmission: transmission.toLowerCase(),
            fuelType,
            seating: parseInt(seating),
            pricePerDay: parseFloat(pricePerDay),
            UnitsAvailable: UnitsAvailable ? parseInt(UnitsAvailable) : 1,
            carstatus: "unavailable", // Will be available only after admin approval
            dec,
            variant: variant || "",
            features: Array.isArray(features) ? features : (features ? [features] : []),
            carImage: carImages,
            video: videoUrl,
            insurance: insuranceUrl,
            pollution: pollutionUrl,
            tacToken: tacTokenUrl,
            rcBook: rcBookUrl,
            status: "pending", // Always pending when submitted
        });

        // Set fleetBy: admin can specify, fleet owners auto-set from their account
        if (role === "admin" && typeof fleetBy !== "undefined" && fleetBy !== null && fleetBy !== "") {
            if (!mongoose.Types.ObjectId.isValid(fleetBy)) {
                return res.status(400).json({ success: false, message: "fleetBy must be a valid user id" });
            }
            const ownerUser = await User.findById(fleetBy);
            if (!ownerUser) {
                return res.status(404).json({ success: false, message: "Specified fleet owner not found" });
            }
            if (ownerUser.role !== "FleetOwner") {
                return res.status(400).json({ success: false, message: "fleetBy must reference a FleetOwner user" });
            }
            newCar.fleetBy = ownerUser._id;
        } else if (role === "fleetowner" && req.user?._id) {
            // Auto-set fleetBy from authenticated fleet owner
            newCar.fleetBy = req.user._id;
        }

        await newCar.save();

        res.status(201).json({
            success: true,
            message: "Car added successfully. Waiting for admin approval.",
            data: newCar,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add car", error: error.message });
    }
};

// Get all cars (only approved and available cars for public, all for admin except deleted)
const getCars = async (req, res) => {
    try {
        const role = (req.user?.role || "").toString().trim().toLowerCase();
        const { fleetBy } = req.query;
        let query = {};

        // Non-admin users only see approved and available cars (not deleted, blocked, or pending)
        if (role !== "admin") {
            query = { status: "approved", carstatus: "available" };
        } else {
            // Admin can see all except deleted cars
            query = { status: { $ne: "delete" } };
        }

        // Filter by fleetBy if provided
        if (fleetBy) {
            if (!mongoose.Types.ObjectId.isValid(fleetBy)) {
                return res.status(400).json({ success: false, message: "fleetBy must be a valid user id" });
            }
            // Verify the user exists and is a FleetOwner
            const fleetOwner = await User.findById(fleetBy);
            if (!fleetOwner) {
                return res.status(404).json({ success: false, message: "Fleet owner not found" });
            }
            if (fleetOwner.role !== "FleetOwner") {
                return res.status(400).json({ success: false, message: "fleetBy must reference a FleetOwner user" });
            }
            query.fleetBy = fleetBy; // Mongoose will automatically convert string to ObjectId
        }

        let queryBuilder = Car.find(query).sort({ createdAt: -1 });
        if (role !== "admin") {
            queryBuilder = queryBuilder.select("-fleetBy");
        }
        const cars = await queryBuilder;
        res.status(200).json({ success: true, data: cars });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch cars", error: error.message });
    }
};

// Get single car by ID
const getCarById = async (req, res) => {
    try {
        const role = (req.user?.role || "").toString().trim().toLowerCase();
        let queryBuilder = Car.findById(req.params.id);
        
        // Exclude deleted cars for non-admin users
        if (role !== "admin") {
            queryBuilder = queryBuilder.select("-fleetBy");
        }
        
        const car = await queryBuilder;
        if (!car) return res.status(404).json({ success: false, message: "Car not found" });

        // Non-admin users cannot see deleted or blocked cars
        if (role !== "admin" && (car.status === "delete" || car.status === "block")) {
            return res.status(404).json({ success: false, message: "Car not found" });
        }

        res.status(200).json({ success: true, data: car });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch car", error: error.message });
    }
};

// Update car - Only FleetOwner and Admin (not Rider)
const updateCar = async (req, res) => {
    try {
        const role = (req.user?.role || "").toString().trim().toLowerCase();
        if (role === "rider") {
            return res.status(403).json({ success: false, message: "Riders cannot update cars" });
        }

        // Check if car exists and is not deleted
        const existingCar = await Car.findById(req.params.id);
        if (!existingCar) {
            return res.status(404).json({ success: false, message: "Car not found" });
        }
        if (existingCar.status === "delete") {
            return res.status(400).json({ success: false, message: "Cannot update a deleted car" });
        }

        const {
            carName,
            brand,
            model,
            year,
            color,
            RegNo,
            transmission,
            fuelType,
            seating,
            pricePerDay,
            UnitsAvailable,
            carstatus,
            dec,
            variant,
            features,
            fleetBy,
        } = req.body;

        const updateData = {};
        if (carName !== undefined) updateData.carName = carName;
        if (brand !== undefined) updateData.brand = brand;
        if (model !== undefined) updateData.model = model;
        if (year !== undefined) updateData.year = parseInt(year);
        if (color !== undefined) updateData.color = color;
        if (RegNo !== undefined) updateData.RegNo = RegNo.toUpperCase();
        if (transmission !== undefined) updateData.transmission = transmission.toLowerCase();
        if (fuelType !== undefined) updateData.fuelType = fuelType;
        if (seating !== undefined) updateData.seating = parseInt(seating);
        if (pricePerDay !== undefined) updateData.pricePerDay = parseFloat(pricePerDay);
        if (UnitsAvailable !== undefined) updateData.UnitsAvailable = parseInt(UnitsAvailable);
        if (dec !== undefined) updateData.dec = dec;
        if (variant !== undefined) updateData.variant = variant;
        if (features !== undefined) updateData.features = Array.isArray(features) ? features : (features ? [features] : []);

        // Only admin can update carstatus
        if (role === "admin" && carstatus !== undefined) {
            updateData.carstatus = carstatus.toLowerCase();
        }

        // Only admin can modify fleetBy
        if (role === "admin" && fleetBy !== undefined) {
            if (fleetBy === null || fleetBy === "") {
                updateData.fleetBy = undefined;
            } else {
                if (!mongoose.Types.ObjectId.isValid(fleetBy)) {
                    return res.status(400).json({ success: false, message: "fleetBy must be a valid user id" });
                }
                const ownerUser = await User.findById(fleetBy);
                if (!ownerUser) {
                    return res.status(404).json({ success: false, message: "Specified fleet owner not found" });
                }
                if (ownerUser.role !== "FleetOwner") {
                    return res.status(400).json({ success: false, message: "fleetBy must reference a FleetOwner user" });
                }
                updateData.fleetBy = ownerUser._id;
            }
        }

        // Upload new car images if provided (must be 5-10)
        if (req.files && req.files.carImage) {
            if (req.files.carImage.length < 5 || req.files.carImage.length > 10) {
                return res.status(400).json({ success: false, message: "carImage must have between 5 and 10 images" });
            }
            const carImageBuffers = req.files.carImage.map(f => f.buffer);
            updateData.carImage = await uploadMultipleFiles(carImageBuffers);
        }

        // Upload new video if provided
        if (req.files && req.files.video && req.files.video[0]) {
            updateData.video = await uploadFile(req.files.video[0].buffer, "video");
        }

        // Upload new document images if provided
        if (req.files && req.files.insurance && req.files.insurance[0]) {
            updateData.insurance = await uploadFile(req.files.insurance[0].buffer);
        }
        if (req.files && req.files.pollution && req.files.pollution[0]) {
            updateData.pollution = await uploadFile(req.files.pollution[0].buffer);
        }
        if (req.files && req.files.tacToken && req.files.tacToken[0]) {
            updateData.tacToken = await uploadFile(req.files.tacToken[0].buffer);
        }
        if (req.files && req.files.rcBook && req.files.rcBook[0]) {
            updateData.rcBook = await uploadFile(req.files.rcBook[0].buffer);
        }

        // Non-admin cannot change status
        if (role !== "admin" && updateData.status) {
            delete updateData.status;
        }

        let updatedCarQuery = Car.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (role !== "admin") {
            updatedCarQuery = updatedCarQuery.select("-fleetBy");
        }
        const car = await updatedCarQuery;
        if (!car) return res.status(404).json({ success: false, message: "Car not found" });

        res.status(200).json({ success: true, message: "Car updated successfully", data: car });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update car", error: error.message });
    }
};

// Delete car - Admin only (soft delete: sets status to 'delete')
const deleteCar = async (req, res) => {
    try {
        const role = (req.user?.role || "").toString().trim().toLowerCase();
        if (role !== "admin") {
            return res.status(403).json({ success: false, message: "Only admin can delete cars" });
        }

        const car = await Car.findByIdAndUpdate(
            req.params.id,
            { status: "delete", carstatus: "unavailable" },
            { new: true }
        );
        if (!car) return res.status(404).json({ success: false, message: "Car not found" });

        res.status(200).json({ success: true, message: "Car deleted successfully. Car will no longer be visible.", data: car });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete car", error: error.message });
    }
};

// Approve car - Admin only (sets status to approved and carstatus to available)
const approveCar = async (req, res) => {
    try {
        const role = (req.user?.role || "").toString().trim().toLowerCase();
        if (role !== "admin") {
            return res.status(403).json({ success: false, message: "Only admin can approve cars" });
        }

        const car = await Car.findByIdAndUpdate(
            req.params.id,
            { status: "approved", carstatus: "available" },
            { new: true }
        );
        if (!car) return res.status(404).json({ success: false, message: "Car not found" });

        res.status(200).json({ success: true, message: "Car approved successfully. Car is now available.", data: car });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to approve car", error: error.message });
    }
};

// Reject car - Admin only
const rejectCar = async (req, res) => {
    try {
        const role = (req.user?.role || "").toString().trim().toLowerCase();
        if (role !== "admin") {
            return res.status(403).json({ success: false, message: "Only admin can reject cars" });
        }

        const car = await Car.findByIdAndUpdate(
            req.params.id,
            { status: "rejected", carstatus: "unavailable" },
            { new: true }
        );
        if (!car) return res.status(404).json({ success: false, message: "Car not found" });

        res.status(200).json({ success: true, message: "Car rejected successfully", data: car });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to reject car", error: error.message });
    }
};

// Block car - Admin only
const blockCar = async (req, res) => {
    try {
        const role = (req.user?.role || "").toString().trim().toLowerCase();
        if (role !== "admin") {
            return res.status(403).json({ success: false, message: "Only admin can block cars" });
        }

        const car = await Car.findByIdAndUpdate(
            req.params.id,
            { status: "block", carstatus: "unavailable" },
            { new: true }
        );
        if (!car) return res.status(404).json({ success: false, message: "Car not found" });

        res.status(200).json({ success: true, message: "Car blocked successfully", data: car });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to block car", error: error.message });
    }
};

// Update car status - Admin only
const updateCarStatus = async (req, res) => {
    try {
        const role = (req.user?.role || "").toString().trim().toLowerCase();
        if (role !== "admin") {
            return res.status(403).json({ success: false, message: "Only admin can update car status" });
        }

        const { status } = req.body;
        const validStatuses = ["pending", "approved", "rejected", "block", "delete"];
        if (!status || !validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }

        const updateData = { status: status.toLowerCase() };
        
        // Set carstatus based on status
        if (status.toLowerCase() === "approved") {
            updateData.carstatus = "available";
        } else if (["rejected", "block", "delete"].includes(status.toLowerCase())) {
            updateData.carstatus = "unavailable";
        }

        const car = await Car.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!car) return res.status(404).json({ success: false, message: "Car not found" });

        res.status(200).json({ success: true, message: "Car status updated successfully", data: car });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update car status", error: error.message });
    }
};

module.exports = {
    addCar,
    getCars,
    getCarById,
    updateCar,
    deleteCar,
    approveCar,
    rejectCar,
    blockCar,
    updateCarStatus,
};
