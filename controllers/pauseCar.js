const mongoose = require("mongoose");
const PauseCar = require("../models/pauseCar");
const Car = require("../models/car");

const normalizeRole = role => (role || "").toString().trim().toLowerCase();

function validateTimeRange(time = {}) {
    if (!time.from || !time.to) return "time.from and time.to are required";
    if (time.from >= time.to) return "time.from must be before time.to";
    return null;
}

const parseDate = value => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

exports.createPauseCar = async (req, res) => {
    try {
        const role = normalizeRole(req.user?.role);
        if (!["fleetowner", "admin"].includes(role)) {
            return res.status(403).json({ success: false, message: "Only fleet owners or admins can pause cars" });
        }

        const { carId, reason, date = {}, time = {}, additionalNote } = req.body;
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

        if (!reason) {
            return res.status(400).json({ success: false, message: "reason is required" });
        }

        const dateFrom = parseDate(date.from);
        const dateTo = parseDate(date.to);
        if (!dateFrom || !dateTo) {
            return res.status(400).json({ success: false, message: "date.from and date.to must be valid dates" });
        }
        if (dateFrom > dateTo) {
            return res.status(400).json({ success: false, message: "date.from must be before or equal to date.to" });
        }

        const timeError = validateTimeRange(time);
        if (timeError) {
            return res.status(400).json({ success: false, message: timeError });
        }

        const payload = {
            carId,
            reason: reason.trim(),
            date: { from: dateFrom, to: dateTo },
            time,
            additionalNote: additionalNote?.trim(),
        };

        if (role === "admin") {
            payload.status = "approved";
            // Update car status to unavailable when admin approves directly
            await Car.findByIdAndUpdate(carId, { carstatus: "unavailable" });
        } else {
            payload.status = "pending";
        }

        const pauseDoc = await PauseCar.create(payload);
        return res.status(201).json({ success: true, data: pauseDoc });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to pause car", error: error.message });
    }
};

exports.getPauseCars = async (req, res) => {
    try {
        const role = normalizeRole(req.user?.role);
        if (!["fleetowner", "admin"].includes(role)) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const { carId, status, fromDate, toDate, page = 1, pageSize = 20 } = req.query;
        const filter = {};
        if (carId) {
            if (!mongoose.Types.ObjectId.isValid(carId)) {
                return res.status(400).json({ success: false, message: "carId must be a valid id" });
            }
            filter.carId = carId;
        }
        if (status) {
            filter.status = status.toString().trim().toLowerCase();
        }
        if (fromDate || toDate) {
            if (fromDate) {
                const d = parseDate(fromDate);
                if (!d) return res.status(400).json({ success: false, message: "fromDate must be a valid date" });
                filter["date.from"] = { $gte: d };
            }
            if (toDate) {
                const d = parseDate(toDate);
                if (!d) return res.status(400).json({ success: false, message: "toDate must be a valid date" });
                filter["date.to"] = Object.assign(filter["date.to"] || {}, { $lte: d });
            }
        }

        const skip = (Number(page) - 1) * Number(pageSize);
        const query = PauseCar.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(pageSize)).populate("carId");
        const [items, total] = await Promise.all([query, PauseCar.countDocuments(filter)]);
        return res.json({
            success: true,
            data: { items, page: Number(page), pageSize: Number(pageSize), total },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch pause requests", error: error.message });
    }
};

exports.getPauseCarById = async (req, res) => {
    try {
        const role = normalizeRole(req.user?.role);
        if (!["fleetowner", "admin"].includes(role)) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
        const pauseCar = await PauseCar.findById(req.params.id).populate("carId");
        if (!pauseCar) {
            return res.status(404).json({ success: false, message: "Pause request not found" });
        }
        return res.json({ success: true, data: pauseCar });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch pause request", error: error.message });
    }
};

exports.approvePauseCar = async (req, res) => {
    try {
        const role = normalizeRole(req.user?.role);
        if (role !== "admin") {
            return res.status(403).json({ success: false, message: "Only admin can approve pause requests" });
        }

        const { status = "approved" } = req.body;
        if (!["approved", "rejected"].includes(status.toString().trim().toLowerCase())) {
            return res.status(400).json({ success: false, message: "status must be approved or rejected" });
        }

        const pauseCar = await PauseCar.findById(req.params.id);
        if (!pauseCar) {
            return res.status(404).json({ success: false, message: "Pause request not found" });
        }

        const newStatus = status.toString().trim().toLowerCase();
        pauseCar.status = newStatus;
        await pauseCar.save();

        // If approved, update car status to unavailable
        if (newStatus === "approved") {
            await Car.findByIdAndUpdate(pauseCar.carId, { carstatus: "unavailable" });
        }

        const updatedPauseCar = await PauseCar.findById(req.params.id).populate("carId");
        return res.json({ success: true, message: "Pause request updated", data: updatedPauseCar });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to update pause request", error: error.message });
    }
};

