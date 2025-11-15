const mongoose = require("mongoose");
const Ride = require("../models/ride");
const Car = require("../models/car");

// Helper function to calculate ride status (ongoing if in time range)
function calculateRideStatus(ride) {
    const rideObj = ride.toObject ? ride.toObject() : ride;
    const storedStatus = rideObj.status?.toLowerCase() || "pending";
    
    // Only calculate ongoing for approved rides
    if (storedStatus !== "approve") {
        return storedStatus;
    }
    
    try {
        const now = new Date();
        const currentDateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
        const currentTimeStr = now.toTimeString().slice(0, 5); // HH:MM
        
        const dateFrom = rideObj.date?.from || "";
        const dateTo = rideObj.date?.to || "";
        const timeFrom = rideObj.time?.from || "";
        const timeTo = rideObj.time?.to || "";
        
        // Check if current time is within the ride's date/time range
        const isAfterStart = currentDateStr > dateFrom || (currentDateStr === dateFrom && currentTimeStr >= timeFrom);
        const isBeforeEnd = currentDateStr < dateTo || (currentDateStr === dateTo && currentTimeStr <= timeTo);
        
        if (isAfterStart && isBeforeEnd) {
            return "ongoing";
        }
        
        return storedStatus;
    } catch (error) {
        // If calculation fails, return stored status
        return storedStatus;
    }
}

// Helper function to process ride(s) and add calculated status
function processRideStatus(ride) {
    if (Array.isArray(ride)) {
        return ride.map(r => {
            const processed = r.toObject ? r.toObject() : { ...r };
            processed.status = calculateRideStatus(r);
            return processed;
        });
    } else {
        const processed = ride.toObject ? ride.toObject() : { ...ride };
        processed.status = calculateRideStatus(ride);
        return processed;
    }
}

function validateRanges(date, time) {
    if (!date || !time) return "date and time are required";
    if (!date.from || !date.to) return "date.from and date.to are required";
    if (!time.from || !time.to) return "time.from and time.to are required";
    if (date.from > date.to) return "date.from must be before or equal to date.to";
    if (time.from >= time.to) return "time.from must be before time.to";
    return null;
}

function validateLocation(location) {
    if (!location) return "location is required";
    if (!location.from) return "location.from is required";
    if (!location.to) return "location.to is required";
    
    // Validate from location
    if (typeof location.from.longitude !== "number" || isNaN(location.from.longitude)) {
        return "location.from.longitude must be a valid number";
    }
    if (typeof location.from.latitude !== "number" || isNaN(location.from.latitude)) {
        return "location.from.latitude must be a valid number";
    }
    
    // Validate to location
    if (typeof location.to.longitude !== "number" || isNaN(location.to.longitude)) {
        return "location.to.longitude must be a valid number";
    }
    if (typeof location.to.latitude !== "number" || isNaN(location.to.latitude)) {
        return "location.to.latitude must be a valid number";
    }
    
    // Validate longitude range (-180 to 180)
    if (location.from.longitude < -180 || location.from.longitude > 180) {
        return "location.from.longitude must be between -180 and 180";
    }
    if (location.to.longitude < -180 || location.to.longitude > 180) {
        return "location.to.longitude must be between -180 and 180";
    }
    
    // Validate latitude range (-90 to 90)
    if (location.from.latitude < -90 || location.from.latitude > 90) {
        return "location.from.latitude must be between -90 and 90";
    }
    if (location.to.latitude < -90 || location.to.latitude > 90) {
        return "location.to.latitude must be between -90 and 90";
    }
    
    return null;
}

exports.createRide = async (req, res) => {
    try {
        const { location, date, time, carId } = req.body;

        if (!carId) {
            return res.status(400).json({ success: false, message: "carId is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(carId)) {
            return res.status(400).json({ success: false, message: "carId must be a valid id" });
        }
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ success: false, message: "Car not found" });
        }

        const rangeError = validateRanges(date, time);
        if (rangeError) return res.status(400).json({ success: false, message: rangeError });

        const locationError = validateLocation(location);
        if (locationError) return res.status(400).json({ success: false, message: locationError });

        const ride = await Ride.create({ carId, location, date, time, status: "pending" });
        
        // Update car status to ongoing when ride is booked
        await Car.findByIdAndUpdate(carId, { status: "ongoing" });
        
        await ride.populate("carId");
        
        const processedRide = processRideStatus(ride);
        res.status(201).json({ success: true, data: processedRide });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create ride", error: error.message });
    }
};

exports.getRides = async (req, res) => {
    try {
        const { riderId, status, dateFrom, dateTo, page = 1, pageSize = 20, carId } = req.query;
        const filter = {};
        if (riderId) filter.riderId = riderId;
        
        // Handle status filter - if "ongoing", we need to filter for "approve" and then calculate
        const statusFilter = status?.toLowerCase();
        if (statusFilter === "ongoing") {
            filter.status = "approve"; // Only approved rides can be ongoing
        } else if (statusFilter) {
            filter.status = statusFilter;
        }
        
        if (carId) {
            if (!mongoose.Types.ObjectId.isValid(carId)) {
                return res.status(400).json({ success: false, message: "carId must be a valid id" });
            }
            filter.carId = carId;
        }
        if (dateFrom || dateTo) {
            filter["date.from"] = dateFrom ? { $gte: dateFrom } : undefined;
            filter["date.to"] = dateTo ? { $lte: dateTo } : undefined;
        }

        // Clean undefined
        Object.keys(filter).forEach((k) => filter[k] === undefined && delete filter[k]);

        const skip = (Number(page) - 1) * Number(pageSize);
        
        // If filtering by "ongoing", we need to get all approved rides, calculate ongoing, then paginate
        if (statusFilter === "ongoing") {
            const allApprovedRides = await Ride.find(filter).sort({ createdAt: -1 }).populate("carId");
            const processedAll = processRideStatus(allApprovedRides);
            const ongoingRides = processedAll.filter(item => item.status === "ongoing");
            const total = ongoingRides.length;
            const items = ongoingRides.slice(skip, skip + Number(pageSize));
            
            return res.json({ success: true, data: { items, page: Number(page), pageSize: Number(pageSize), total } });
        }
        
        // Normal filtering for other statuses
        const [items, total] = await Promise.all([
            Ride.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(pageSize)).populate("carId"),
            Ride.countDocuments(filter),
        ]);

        // Process status (calculate ongoing)
        const processedItems = processRideStatus(items);

        res.json({ success: true, data: { items: processedItems, page: Number(page), pageSize: Number(pageSize), total } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to get rides", error: error.message });
    }
};

exports.getRideById = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id).populate("carId");
        if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });
        
        const processedRide = processRideStatus(ride);
        res.json({ success: true, data: processedRide });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to get ride", error: error.message });
    }
};

exports.updateRide = async (req, res) => {
    try {
        const { id } = req.params;
        const { location, date, time, carId } = req.body;

        if (location) {
            const e = validateLocation(location);
            if (e) return res.status(400).json({ success: false, message: e });
        }
        
        // Validate date and time if both are provided, or validate individually
        if (date && time) {
            const e = validateRanges(date, time);
            if (e) return res.status(400).json({ success: false, message: e });
        } else if (date) {
            // If only date is provided, validate date structure
            if (!date.from || !date.to) {
                return res.status(400).json({ success: false, message: "date.from and date.to are required" });
            }
            if (date.from > date.to) {
                return res.status(400).json({ success: false, message: "date.from must be before or equal to date.to" });
            }
        } else if (time) {
            // If only time is provided, validate time structure
            if (!time.from || !time.to) {
                return res.status(400).json({ success: false, message: "time.from and time.to are required" });
            }
            if (time.from >= time.to) {
                return res.status(400).json({ success: false, message: "time.from must be before time.to" });
            }
        }

        const ride = await Ride.findById(id);
        if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });

        // Prevent status changes here
        const update = { location, date, time };
        if (carId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(carId)) {
                return res.status(400).json({ success: false, message: "carId must be a valid id" });
            }
            const car = await Car.findById(carId);
            if (!car) {
                return res.status(404).json({ success: false, message: "Car not found" });
            }
            update.carId = carId;
        }
        Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

        Object.assign(ride, update);
        await ride.save();
        await ride.populate("carId");
        
        const processedRide = processRideStatus(ride);
        res.json({ success: true, data: processedRide });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update ride", error: error.message });
    }
};

exports.updateRideStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const normalizedStatus = status?.toLowerCase();
        
        // Don't allow setting ongoing manually - it's auto-calculated
        if (!["approve", "reject", "pending"].includes(normalizedStatus)) {
            return res.status(400).json({ success: false, message: "status must be approve, reject, or pending. Ongoing status is automatically calculated." });
        }
        
        const ride = await Ride.findById(req.params.id);
        if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });
        
        // Update ride status
        ride.status = normalizedStatus;
        await ride.save();
        
        // Update car status based on ride status
        if (normalizedStatus === "reject") {
            // If ride is rejected, set car status back to approved (if it was ongoing)
            const car = await Car.findById(ride.carId);
            if (car && car.status === "ongoing") {
                await Car.findByIdAndUpdate(ride.carId, { status: "approved" });
            }
        } else if (normalizedStatus === "approve") {
            // If ride is approved, set car status to ongoing
            await Car.findByIdAndUpdate(ride.carId, { status: "ongoing" });
        }
        
        await ride.populate("carId");
        const processedRide = processRideStatus(ride);
        res.json({ success: true, data: processedRide });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status", error: error.message });
    }
};


