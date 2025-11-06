const Adventure = require("../models/adventure");
const { uploadFile } = require("../utils/cloudinary");

// Create an adventure
const createAdventure = async (req, res) => {
    try {
        const { fleetby, carModel, year, location, rating, trips, ridername, feedback } = req.body;

        if (!fleetby || !carModel || !year || !location || !ridername) {
            return res.status(400).json({ success: false, message: "fleetby, carModel, year, location, ridername are required" });
        }

        if (!req.files || !req.files.image || !req.files.image[0]) {
            return res.status(400).json({ success: false, message: "image is required" });
        }

        const imageUrl = await uploadFile(req.files.image[0].buffer);

        const adventure = await Adventure.create({
            fleetby,
            carModel,
            year,
            location,
            rating,
            trips,
            ridername,
            feedback,
            image: imageUrl,
        });

        res.status(201).json({ success: true, message: "Adventure created", data: adventure });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create adventure", error: error.message });
    }
};

// Get all adventures
const listAdventures = async (req, res) => {
    try {
        const adventures = await Adventure.find()
            .populate("fleetby", "name email phone role")
            .populate("ridername", "name email phone role")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: adventures });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch adventures", error: error.message });
    }
};

// Get one adventure by id
const getAdventureById = async (req, res) => {
    try {
        const { id } = req.params;
        const adventure = await Adventure.findById(id)
            .populate("fleetby", "name email phone role")
            .populate("ridername", "name email phone role");
        if (!adventure) return res.status(404).json({ success: false, message: "Adventure not found" });
        res.status(200).json({ success: true, data: adventure });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch adventure", error: error.message });
    }
};

// Update an adventure
const updateAdventure = async (req, res) => {
    try {
        const { id } = req.params;
        const { fleetby, carModel, year, location, rating, trips, ridername, feedback } = req.body;

        const update = {};
        if (fleetby !== undefined) update.fleetby = fleetby;
        if (carModel !== undefined) update.carModel = carModel;
        if (year !== undefined) update.year = year;
        if (location !== undefined) update.location = location;
        if (rating !== undefined) update.rating = rating;
        if (trips !== undefined) update.trips = trips;
        if (ridername !== undefined) update.ridername = ridername;
        if (feedback !== undefined) update.feedback = feedback;

        if (req.files && req.files.image && req.files.image[0]) {
            update.image = await uploadFile(req.files.image[0].buffer);
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ success: false, message: "No data provided to update" });
        }

        const adventure = await Adventure.findByIdAndUpdate(id, update, { new: true })
            .populate("fleetby", "name email phone role")
            .populate("ridername", "name email phone role");
        if (!adventure) return res.status(404).json({ success: false, message: "Adventure not found" });
        res.status(200).json({ success: true, message: "Adventure updated", data: adventure });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update adventure", error: error.message });
    }
};

// Delete an adventure
const deleteAdventure = async (req, res) => {
    try {
        const { id } = req.params;
        const adventure = await Adventure.findByIdAndDelete(id);
        if (!adventure) return res.status(404).json({ success: false, message: "Adventure not found" });
        res.status(200).json({ success: true, message: "Adventure deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete adventure", error: error.message });
    }
};

// Optional filters
const listAdventuresByFleetOwner = async (req, res) => {
    try {
        const { fleetId } = req.params;
        const adventures = await Adventure.find({ fleetby: fleetId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: adventures });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch adventures", error: error.message });
    }
};

const listAdventuresByRider = async (req, res) => {
    try {
        const { riderId } = req.params;
        const adventures = await Adventure.find({ ridername: riderId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: adventures });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch adventures", error: error.message });
    }
};

module.exports = {
    createAdventure,
    listAdventures,
    getAdventureById,
    updateAdventure,
    deleteAdventure,
    listAdventuresByFleetOwner,
    listAdventuresByRider,
};


