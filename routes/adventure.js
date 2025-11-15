const express = require("express");
const router = express.Router();
const {
    createAdventure,
    listAdventures,
    getAdventureById,
    updateAdventure,
    deleteAdventure,
    listAdventuresByFleetOwner,
    listAdventuresByRider,
} = require("../controllers/adventure");
const { auth, requireAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Public: list adventures
router.get("/", listAdventures);

// Public: get one
router.get("/:id", getAdventureById);

// Filters (optional)
router.get("/fleet/:fleetId", listAdventuresByFleetOwner);
router.get("/rider/:riderId", listAdventuresByRider);

// Protected: create (auth)
router.post(
    "/",
    auth,
    upload.fields([{ name: "image", maxCount: 1 }]),
    createAdventure
);

// Protected: update (auth)
router.put(
    "/:id",
    auth,
    upload.fields([{ name: "image", maxCount: 1 }]),
    updateAdventure
);

// Protected: delete (admin only or change as needed)
router.delete(
    "/:id",
    auth,
    requireAdmin,
    deleteAdventure
);

module.exports = router;




