// routes/adminOfferRoutes.js
const express = require("express");
const router = express.Router();

const {
    createOffer,
    getAllOffers,
    getOfferById,
    updateOffer,
    deleteOffer,
} = require("../controllers/adminOffer");

const { auth, requireAdmin } = require("../middlewares/auth");

// ✅ All routes: must be authenticated AND admin
router.post("/", auth, requireAdmin, createOffer);
router.get("/", auth, requireAdmin, getAllOffers);
router.get("/:id", auth, requireAdmin, getOfferById);
router.put("/:id", auth, requireAdmin, updateOffer);
router.delete("/:id", auth, requireAdmin, deleteOffer);

module.exports = router;
