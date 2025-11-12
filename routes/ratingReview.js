const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const controller = require("../controllers/ratingReview");

// Create or upsert a rating
router.post("/", auth, controller.createRating);

// List ratings for a specific carId, with average
router.get("/car/:carId", auth, controller.getCardRatings);

// List ratings for a specific rider, with average
router.get("/rider/:riderId", auth, controller.getRiderRatings);

// Update my rating
router.put("/:id", auth, controller.updateMyRating);

// Delete my rating (or admin)
router.delete("/:id", auth, controller.deleteMyRating);

module.exports = router;


