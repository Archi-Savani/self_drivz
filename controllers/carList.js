const mongoose = require("mongoose");
const CarList = require("../models/carList");
const Car = require("../models/car");
const User = require("../models/user");

const normalizeRole = role => (role || "").toString().trim().toLowerCase();

const parseBoolean = value => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    const str = value.toString().trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(str)) return true;
    if (["false", "0", "no", "n"].includes(str)) return false;
    return undefined;
};

const extractRentalPeriod = body => {
    const rentalPeriod = body?.rentalPeriod;
    const from = rentalPeriod?.from ?? body?.rentalPeriodFrom ?? body?.from ?? null;
    const to = rentalPeriod?.to ?? body?.rentalPeriodTo ?? body?.to ?? null;
    return { from, to };
};

exports.createCarList = async (req, res) => {
    try {
        const role = normalizeRole(req.user?.role);
        if (!["fleetowner", "admin"].includes(role)) {
            return res.status(403).json({ success: false, message: "Only fleet owners and admins can create car listings" });
        }

        const { city, parkingLocation, car, pricePerDay } = req.body;
        const ApprovePricePerDay = req.body?.ApprovePricePerDay;
        const fleetBy = req.body?.fleetBy;
        const deliveryAvailable = parseBoolean(req.body?.deliveryAvailable);
        const { from, to } = extractRentalPeriod(req.body);

        if (!city || !parkingLocation || !car || pricePerDay === undefined || pricePerDay === null) {
            return res.status(400).json({ success: false, message: "city, parkingLocation, car, pricePerDay are required" });
        }
        if (!from || !to) {
            return res.status(400).json({ success: false, message: "rentalPeriod.from and rentalPeriod.to are required" });
        }
        if (!mongoose.Types.ObjectId.isValid(car)) {
            return res.status(400).json({ success: false, message: "car must be a valid id" });
        }
        const carDoc = await Car.findById(car);
        if (!carDoc) {
            return res.status(404).json({ success: false, message: "Car not found" });
        }

        const numericPrice = Number(pricePerDay);
        if (Number.isNaN(numericPrice) || numericPrice < 0) {
            return res.status(400).json({ success: false, message: "pricePerDay must be a positive number" });
        }

        const rentalFrom = new Date(from);
        const rentalTo = new Date(to);
        if (Number.isNaN(rentalFrom.getTime()) || Number.isNaN(rentalTo.getTime())) {
            return res.status(400).json({ success: false, message: "rentalPeriod.from and rentalPeriod.to must be valid dates" });
        }
        if (rentalFrom > rentalTo) {
            return res.status(400).json({ success: false, message: "rentalPeriod.from cannot be after rentalPeriod.to" });
        }

        const payload = {
            city: city.trim(),
            parkingLocation: parkingLocation.trim(),
            car,
            pricePerDay: numericPrice,
            rentalPeriod: { from: rentalFrom, to: rentalTo },
            deliveryAvailable: deliveryAvailable !== undefined ? deliveryAvailable : false,
        };

        // Admin-only fields
        if (role === "admin") {
            if (fleetBy !== undefined && fleetBy !== null && fleetBy !== "") {
                if (!mongoose.Types.ObjectId.isValid(fleetBy)) {
                    return res.status(400).json({ success: false, message: "fleetBy must be a valid user id" });
                }
                const ownerUser = await require("../models/user").findById(fleetBy);
                if (!ownerUser) {
                    return res.status(404).json({ success: false, message: "Specified fleet owner not found" });
                }
                if (normalizeRole(ownerUser.role) !== "fleetowner") {
                    return res.status(400).json({ success: false, message: "fleetBy must reference a FleetOwner user" });
                }
                payload.fleetBy = ownerUser._id;
            }
            if (ApprovePricePerDay !== undefined && ApprovePricePerDay !== null && ApprovePricePerDay !== "") {
                const approvePrice = Number(ApprovePricePerDay);
                if (Number.isNaN(approvePrice) || approvePrice < 0) {
                    return res.status(400).json({ success: false, message: "ApprovePricePerDay must be a positive number" });
                }
                payload.ApprovePricePerDay = approvePrice;
            }
        }

        const doc = await CarList.create(payload);
        const responseData = doc.toObject();
        if (role !== "admin") {
            delete responseData.fleetBy;
            delete responseData.ApprovePricePerDay;
        } else {
            if (responseData.ApprovePricePerDay !== undefined && responseData.ApprovePricePerDay !== null) {
                delete responseData.pricePerDay;
            }
        }

        return res.status(201).json({ success: true, message: "Car listing created successfully", data: responseData });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to create car listing", error: error.message });
    }
};

exports.getCarLists = async (req, res) => {
    try {
        const role = normalizeRole(req.user?.role);

        // Query params
        const {
            city,
            car, // exact carId
            deliveryAvailable,
            category, // mapped to car.variant
            transmission, // car.transmission
            fuelType, // car.fuelType
            seats, // minimum seating
            ratingReview, // minimum average rating
            minPrice,
            maxPrice,
            periodFrom,
            periodTo,
            sort, // price_low_to_high | price_high_to_low | ratings_high_to_low
        } = req.query;

        // Base match (fields directly on CarList)
        const match = {};
        if (city) {
            match.city = { $regex: city.trim(), $options: "i" };
        }
        if (car) {
            if (!mongoose.Types.ObjectId.isValid(car)) {
                return res.status(400).json({ success: false, message: "car must be a valid id" });
            }
            match.car = new mongoose.Types.ObjectId(car);
        }
        if (deliveryAvailable !== undefined) {
            const parsed = parseBoolean(deliveryAvailable);
            if (parsed === undefined) {
                return res.status(400).json({ success: false, message: "deliveryAvailable must be a boolean" });
            }
            match.deliveryAvailable = parsed;
        }
        if ((periodFrom && !periodTo) || (!periodFrom && periodTo)) {
            return res.status(400).json({ success: false, message: "Both periodFrom and periodTo are required" });
        }

        const pipeline = [{ $match: match }];

        // Constrain by rental period containment if provided
        if (periodFrom && periodTo) {
            const fromDate = new Date(periodFrom);
            const toDate = new Date(periodTo);
            if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
                return res.status(400).json({ success: false, message: "periodFrom and periodTo must be valid dates" });
            }
            pipeline.push({
                $match: {
                    "rentalPeriod.from": { $lte: fromDate },
                    "rentalPeriod.to": { $gte: toDate },
                },
            });
        }

        // Join car details for car-based filters
        pipeline.push(
            {
                $lookup: {
                    from: "cars",
                    localField: "car",
                    foreignField: "_id",
                    as: "car",
                },
            },
            { $unwind: "$car" }
        );

        // Apply car-based filters
        const carAndFilters = {};
        if (category) {
            carAndFilters["car.variant"] = { $regex: category.trim(), $options: "i" };
        }
        if (transmission) {
            carAndFilters["car.transmission"] = transmission.toString().trim().toLowerCase();
        }
        if (fuelType) {
            carAndFilters["car.fuelType"] = { $regex: `^${fuelType}$`, $options: "i" };
        }
        if (seats !== undefined) {
            const minSeats = Number(seats);
            if (Number.isNaN(minSeats) || minSeats < 1) {
                return res.status(400).json({ success: false, message: "seats must be a positive number" });
            }
            carAndFilters["car.seating"] = { $gte: minSeats };
        }
        if (Object.keys(carAndFilters).length) {
            pipeline.push({ $match: carAndFilters });
        }

        // Ratings aggregation per car
        pipeline.push(
            {
                $lookup: {
                    from: "ratingreviews",
                    let: { carId: "$car._id" },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$carId", "$$carId"] }, { $eq: ["$riderId", null] }] } } },
                        { $group: { _id: "$carId", avgRate: { $avg: "$rate" }, count: { $sum: 1 } } },
                    ],
                    as: "ratingSummary",
                },
            },
            {
                $addFields: {
                    avgRating: { $ifNull: [{ $arrayElemAt: ["$ratingSummary.avgRate", 0] }, 0] },
                    ratingCount: { $ifNull: [{ $arrayElemAt: ["$ratingSummary.count", 0] }, 0] },
                },
            }
        );

        if (ratingReview !== undefined) {
            const minRating = Number(ratingReview);
            if (Number.isNaN(minRating) || minRating < 0 || minRating > 5) {
                return res.status(400).json({ success: false, message: "ratingReview must be a number between 0 and 5" });
            }
            pipeline.push({ $match: { avgRating: { $gte: minRating } } });
        }

        // Effective price = ApprovePricePerDay (if exists) else pricePerDay
        pipeline.push({
            $addFields: {
                effectivePrice: { $ifNull: ["$ApprovePricePerDay", "$pricePerDay"] },
            },
        });

        // Price range filter
        const hasMin = minPrice !== undefined && minPrice !== "";
        const hasMax = maxPrice !== undefined && maxPrice !== "";
        if (hasMin || hasMax) {
            const min = hasMin ? Number(minPrice) : undefined;
            const max = hasMax ? Number(maxPrice) : undefined;
            if ((hasMin && (Number.isNaN(min) || min < 0)) || (hasMax && (Number.isNaN(max) || max < 0))) {
                return res.status(400).json({ success: false, message: "minPrice/maxPrice must be positive numbers" });
            }
            const priceMatch = {};
            if (hasMin) priceMatch.$gte = min;
            if (hasMax) priceMatch.$lte = max;
            pipeline.push({ $match: { effectivePrice: priceMatch } });
        }

        // Sorting
        let sortStage = { createdAt: -1 };
        if (sort) {
            const sortVal = sort.toString().trim().toLowerCase();
            if (sortVal === "price_low_to_high" || sortVal === "price-asc" || sortVal === "price_asc") {
                sortStage = { effectivePrice: 1 };
            } else if (sortVal === "price_high_to_low" || sortVal === "price-desc" || sortVal === "price_desc") {
                sortStage = { effectivePrice: -1 };
            } else if (sortVal === "ratings_high_to_low" || sortVal === "rating_desc") {
                sortStage = { avgRating: -1 };
            }
        }
        pipeline.push({ $sort: sortStage });

        // Projection based on role
        if (role === "admin") {
            pipeline.push(
                {
                    $lookup: {
                        from: "users",
                        localField: "fleetBy",
                        foreignField: "_id",
                        as: "fleetBy",
                    },
                },
                { $unwind: { path: "$fleetBy", preserveNullAndEmptyArrays: true } }
            );
        } else {
            pipeline.push({
                $project: {
                    fleetBy: 0,
                    ApprovePricePerDay: 0,
                },
            });
        }

        const carLists = await CarList.aggregate(pipeline);
        return res.json({ success: true, data: carLists });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch car listings", error: error.message });
    }
};

exports.getCarListById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid listing id" });
        }

        const role = normalizeRole(req.user?.role);
        let queryBuilder = CarList.findById(id).populate("car");
        if (role === "admin") {
            queryBuilder = queryBuilder.populate("fleetBy", "name email phone role");
        } else {
            queryBuilder = queryBuilder.select("-fleetBy -ApprovePricePerDay");
        }

        const carList = await queryBuilder;

        if (!carList) {
            return res.status(404).json({ success: false, message: "Car listing not found" });
        }

        return res.json({ success: true, data: carList });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch car listing", error: error.message });
    }
};

exports.updateCarList = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid listing id" });
        }

        const carList = await CarList.findById(id);
        if (!carList) {
            return res.status(404).json({ success: false, message: "Car listing not found" });
        }

        const role = normalizeRole(req.user?.role);
        if (!["fleetowner", "admin"].includes(role)) {
            return res.status(403).json({ success: false, message: "You are not authorized to update this listing" });
        }

        const updates = {};
        const { city, parkingLocation, car, pricePerDay } = req.body;
        const deliveryAvailable = parseBoolean(req.body?.deliveryAvailable);
        const { from, to } = extractRentalPeriod(req.body);

        if (city !== undefined) updates.city = city.trim();
        if (parkingLocation !== undefined) updates.parkingLocation = parkingLocation.trim();

        if (car !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(car)) {
                return res.status(400).json({ success: false, message: "car must be a valid id" });
            }
            const carDoc = await Car.findById(car);
            if (!carDoc) {
                return res.status(404).json({ success: false, message: "Car not found" });
            }
            updates.car = car;
        }

        if (pricePerDay !== undefined) {
            const numericPrice = Number(pricePerDay);
            if (Number.isNaN(numericPrice) || numericPrice < 0) {
                return res.status(400).json({ success: false, message: "pricePerDay must be a positive number" });
            }
            updates.pricePerDay = numericPrice;
        }

        if (from !== null || to !== null) {
            if (!from || !to) {
                return res.status(400).json({ success: false, message: "Both rentalPeriod.from and rentalPeriod.to are required to update rental period" });
            }
            const rentalFrom = new Date(from);
            const rentalTo = new Date(to);
            if (Number.isNaN(rentalFrom.getTime()) || Number.isNaN(rentalTo.getTime())) {
                return res.status(400).json({ success: false, message: "rentalPeriod.from and rentalPeriod.to must be valid dates" });
            }
            if (rentalFrom > rentalTo) {
                return res.status(400).json({ success: false, message: "rentalPeriod.from cannot be after rentalPeriod.to" });
            }
            updates.rentalPeriod = { from: rentalFrom, to: rentalTo };
        }

        if (deliveryAvailable !== undefined) {
            updates.deliveryAvailable = deliveryAvailable;
        }

        if (role === "admin") {
            if (Object.prototype.hasOwnProperty.call(req.body, "fleetBy")) {
                const fleetByValue = req.body.fleetBy;
                if (fleetByValue === null || fleetByValue === "") {
                    updates.fleetBy = undefined;
                } else {
                    if (!mongoose.Types.ObjectId.isValid(fleetByValue)) {
                        return res.status(400).json({ success: false, message: "fleetBy must be a valid user id" });
                    }
                    const ownerUser = await User.findById(fleetByValue);
                    if (!ownerUser) {
                        return res.status(404).json({ success: false, message: "Specified fleet owner not found" });
                    }
                    if (normalizeRole(ownerUser.role) !== "fleetowner") {
                        return res.status(400).json({ success: false, message: "fleetBy must reference a FleetOwner user" });
                    }
                    updates.fleetBy = ownerUser._id;
                }
            }

            if (Object.prototype.hasOwnProperty.call(req.body, "ApprovePricePerDay")) {
                const approvePriceRaw = req.body.ApprovePricePerDay;
                if (approvePriceRaw === null || approvePriceRaw === "") {
                    updates.ApprovePricePerDay = undefined;
                } else {
                    const approvePrice = Number(approvePriceRaw);
                    if (Number.isNaN(approvePrice) || approvePrice < 0) {
                        return res.status(400).json({ success: false, message: "ApprovePricePerDay must be a positive number" });
                    }
                    updates.ApprovePricePerDay = approvePrice;
                }
            }
        }

        let queryBuilder = CarList.findByIdAndUpdate(id, updates, { new: true }).populate("car");
        if (role === "admin") {
            queryBuilder = queryBuilder.populate("fleetBy", "name email phone role");
        } else {
            queryBuilder = queryBuilder.select("-fleetBy -ApprovePricePerDay");
        }

        const updatedCarList = await queryBuilder;

        if (role === "admin") {
            const responseData = updatedCarList.toObject();
            if (responseData.ApprovePricePerDay !== undefined && responseData.ApprovePricePerDay !== null) {
                delete responseData.pricePerDay;
            }
            return res.json({ success: true, message: "Car listing updated successfully", data: responseData });
        }

        return res.json({ success: true, message: "Car listing updated successfully", data: updatedCarList });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to update car listing", error: error.message });
    }
};

exports.deleteCarList = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid listing id" });
        }

        const carList = await CarList.findById(id);
        if (!carList) {
            return res.status(404).json({ success: false, message: "Car listing not found" });
        }

        const role = normalizeRole(req.user?.role);
        if (!["fleetowner", "admin"].includes(role)) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this listing" });
        }

        await carList.deleteOne();

        return res.json({ success: true, message: "Car listing deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to delete car listing", error: error.message });
    }
};

