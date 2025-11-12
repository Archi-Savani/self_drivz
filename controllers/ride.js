const Ride = require("../models/ride");

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
        const { location, date, time } = req.body;

        const rangeError = validateRanges(date, time);
        if (rangeError) return res.status(400).json({ success: false, message: rangeError });

        const locationError = validateLocation(location);
        if (locationError) return res.status(400).json({ success: false, message: locationError });

        const ride = await Ride.create({ location, date, time, status: "pending" });

        res.status(201).json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create ride", error: error.message });
    }
};

exports.getRides = async (req, res) => {
    try {
        const { riderId, status, dateFrom, dateTo, page = 1, pageSize = 20 } = req.query;
        const filter = {};
        if (riderId) filter.riderId = riderId;
        if (status) filter.status = status;
        if (dateFrom || dateTo) {
            filter["date.from"] = dateFrom ? { $gte: dateFrom } : undefined;
            filter["date.to"] = dateTo ? { $lte: dateTo } : undefined;
        }

        // Clean undefined
        Object.keys(filter).forEach((k) => filter[k] === undefined && delete filter[k]);

        const skip = (Number(page) - 1) * Number(pageSize);
        const [items, total] = await Promise.all([
            Ride.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(pageSize)),
            Ride.countDocuments(filter),
        ]);

        res.json({ success: true, data: { items, page: Number(page), pageSize: Number(pageSize), total } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to get rides", error: error.message });
    }
};

exports.getRideById = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);
        if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });
        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to get ride", error: error.message });
    }
};

exports.updateRide = async (req, res) => {
    try {
        const { id } = req.params;
        const { location, date, time } = req.body;

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
        Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

        Object.assign(ride, update);
        await ride.save();
        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update ride", error: error.message });
    }
};

exports.updateRideStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["approve", "reject"].includes(status)) {
            return res.status(400).json({ success: false, message: "status must be approve or reject" });
        }
        const ride = await Ride.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });
        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status", error: error.message });
    }
};


