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
    if (!location || !location.mode) return "location.mode is required";
    if (!["live", "manual"].includes(location.mode)) return "location.mode must be live or manual";
    if (location.mode === "live") {
        if (!location.live) return "location.live is required when mode=live";
        if (location.manual) return "location.manual must be null when mode=live";
    }
    if (location.mode === "manual") {
        if (!location.manual) return "location.manual is required when mode=manual";
        if (location.live) return "location.live must be null when mode=manual";
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
        if (date || time) {
            const e = validateRanges(date ?? { from: "0000-00-00", to: "9999-99-99" }, time ?? { from: "00:00", to: "23:59" });
            if (e && (date || time)) return res.status(400).json({ success: false, message: e });
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


