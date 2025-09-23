// controllers/adminOfferController.js
const AdminOffer = require("../models/adminOffer");

// ✅ Create Offer
const createOffer = async (req, res) => {
    try {
        const newOffer = new AdminOffer(req.body);
        await newOffer.save();
        res.status(201).json({
            success: true,
            message: "Offer created successfully",
            data: newOffer,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create offer",
            error: error.message,
        });
    }
};

// ✅ Get All Offers
const getAllOffers = async (req, res) => {
    try {
        const offers = await AdminOffer.find();
        res.status(200).json({ success: true, data: offers });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch offers",
            error: error.message,
        });
    }
};

// ✅ Get Offer by ID
const getOfferById = async (req, res) => {
    try {
        const offer = await AdminOffer.findById(req.params.id);
        if (!offer) {
            return res
                .status(404)
                .json({ success: false, message: "Offer not found" });
        }
        res.status(200).json({ success: true, data: offer });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch offer",
            error: error.message,
        });
    }
};

// ✅ Update Offer
const updateOffer = async (req, res) => {
    try {
        const updatedOffer = await AdminOffer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedOffer) {
            return res
                .status(404)
                .json({ success: false, message: "Offer not found" });
        }
        res.status(200).json({
            success: true,
            message: "Offer updated successfully",
            data: updatedOffer,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update offer",
            error: error.message,
        });
    }
};

// ✅ Delete Offer
const deleteOffer = async (req, res) => {
    try {
        const deletedOffer = await AdminOffer.findByIdAndDelete(req.params.id);
        if (!deletedOffer) {
            return res
                .status(404)
                .json({ success: false, message: "Offer not found" });
        }
        res
            .status(200)
            .json({ success: true, message: "Offer deleted successfully" });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete offer",
            error: error.message,
        });
    }
};

module.exports = {
    createOffer,
    getAllOffers,
    getOfferById,
    updateOffer,
    deleteOffer,
};
