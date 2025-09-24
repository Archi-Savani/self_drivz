const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middlewares/auth");
const controller = require("../controllers/terms");

// Public: get latest terms & conditions
router.get("/", controller.getLatest);

// Admin: create a new version
router.post("/", auth, requireAdmin, controller.createOrUpdate);

// Admin: update/delete by id
router.put("/:id", auth, requireAdmin, controller.updateById);
router.delete("/:id", auth, requireAdmin, controller.deleteById);

module.exports = router;


