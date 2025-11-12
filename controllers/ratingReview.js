const RatingReview = require("../models/ratingReview");
const Car = require("../models/car");
const User = require("../models/user");
const mongoose = require("mongoose");

function normalizeRole(role) {
    if (!role) return "";
    const r = role.toString().trim().toLowerCase();
    if (r === "rider") return "rider";
    if (r === "fleetowner" || r === "fleet owner") return "fleetowner";
    if (r === "admin") return "admin";
    return r;
}

exports.createRating = async (req, res) => {
    try {
        const currentUserId = req.user?.id || req.user?._id;
        if (!currentUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const role = normalizeRole(req.user?.role);
        if (!["rider", "fleetowner"].includes(role)) {
            return res.status(403).json({ success: false, message: "Only Rider and FleetOwner can give ratings" });
        }

        const body = req.body || {};
        const { carId, riderId, rate, review = "" } = body;
        if (rate === undefined || rate === null) {
            return res.status(400).json({ success: false, message: "rate is required" });
        }
        const numericRate = Number(rate);
        if (Number.isNaN(numericRate) || numericRate < 0 || numericRate > 5) {
            return res.status(400).json({ success: false, message: "rate must be a number between 0 and 5" });
        }

        let payload = { rate: numericRate, review: review ?? "" };

        if (role === "rider") {
            if (!carId) {
                return res.status(400).json({ success: false, message: "carId is required when rider gives rating" });
            }
            if (!mongoose.Types.ObjectId.isValid(carId)) {
                return res.status(400).json({ success: false, message: "carId must be a valid id" });
            }
            const car = await Car.findById(carId);
            if (!car) {
                return res.status(404).json({ success: false, message: "Car not found" });
            }
            payload.carId = carId;
        } else if (role === "fleetowner") {
            if (!riderId) {
                return res.status(400).json({ success: false, message: "riderId is required when fleet owner gives rating" });
            }
            if (!mongoose.Types.ObjectId.isValid(riderId)) {
                return res.status(400).json({ success: false, message: "riderId must be a valid id" });
            }
            const rider = await User.findById(riderId);
            if (!rider) {
                return res.status(404).json({ success: false, message: "Rider not found" });
            }
            if (normalizeRole(rider.role) !== "rider") {
                return res.status(400).json({ success: false, message: "Provided user is not a rider" });
            }
            payload.riderId = riderId;
        }

        const doc = await RatingReview.create(payload);

        return res.status(201).json({ success: true, data: doc });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to create rating", error: error.message });
    }
};

exports.getCardRatings = async (req, res) => {
    try {
        const { carId } = req.params;
        if (!carId) return res.status(400).json({ success: false, message: "carId is required" });
        if (!mongoose.Types.ObjectId.isValid(carId)) {
            return res.status(400).json({ success: false, message: "carId must be a valid id" });
        }

        const car = await Car.findById(carId);
        if (!car) return res.status(404).json({ success: false, message: "Car not found" });

        const { page = 1, pageSize = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);

        const match = { carId: new mongoose.Types.ObjectId(carId), riderId: null };

        const [items, summaryAgg] = await Promise.all([
            RatingReview.find({ carId, riderId: null })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(pageSize)),
            RatingReview.aggregate([{ $match: match }, { $group: { _id: null, avgRate: { $avg: "$rate" }, count: { $sum: 1 } } }]),
        ]);

        const summary = summaryAgg[0] || { avgRate: 0, count: 0 };

        return res.json({
            success: true,
            data: {
                items,
                page: Number(page),
                pageSize: Number(pageSize),
                total: summary.count,
                average: summary.avgRate ?? 0,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch ratings", error: error.message });
    }
};

exports.getRiderRatings = async (req, res) => {
    try {
        const { riderId } = req.params;
        if (!riderId) return res.status(400).json({ success: false, message: "riderId is required" });
        if (!mongoose.Types.ObjectId.isValid(riderId)) {
            return res.status(400).json({ success: false, message: "riderId must be a valid id" });
        }

        const rider = await User.findById(riderId);
        if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });
        if (normalizeRole(rider.role) !== "rider") {
            return res.status(400).json({ success: false, message: "Provided user is not a rider" });
        }

        const { page = 1, pageSize = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);

        const match = { riderId: new mongoose.Types.ObjectId(riderId), carId: null };

        const [items, summaryAgg] = await Promise.all([
            RatingReview.find({ riderId, carId: null })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(pageSize)),
            RatingReview.aggregate([{ $match: match }, { $group: { _id: null, avgRate: { $avg: "$rate" }, count: { $sum: 1 } } }]),
        ]);

        const summary = summaryAgg[0] || { avgRate: 0, count: 0 };

        return res.json({
            success: true,
            data: {
                items,
                page: Number(page),
                pageSize: Number(pageSize),
                total: summary.count,
                average: summary.avgRate ?? 0,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch ratings", error: error.message });
    }
};

exports.updateMyRating = async (req, res) => {
    try {
        const { id } = req.params;
        const { rate, review } = req.body;
        const role = normalizeRole(req.user?.role);
        if (!["rider", "fleetowner", "admin"].includes(role)) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const doc = await RatingReview.findById(id);
        if (!doc) return res.status(404).json({ success: false, message: "Rating not found" });

        if (rate !== undefined) {
            const numericRate = Number(rate);
            if (Number.isNaN(numericRate) || numericRate < 0 || numericRate > 5) {
                return res.status(400).json({ success: false, message: "rate must be a number between 0 and 5" });
            }
            doc.rate = numericRate;
        }
        if (review !== undefined) {
            doc.review = review ?? "";
        }
        await doc.save();
        return res.json({ success: true, data: doc });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to update rating", error: error.message });
    }
};

exports.deleteMyRating = async (req, res) => {
    try {
        const { id } = req.params;
        const role = normalizeRole(req.user?.role);
        if (!["rider", "fleetowner", "admin"].includes(role)) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const deleted = await RatingReview.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: "Rating not found" });

        return res.json({ success: true, message: "Rating deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to delete rating", error: error.message });
    }
};


