const express = require("express");
const router = express.Router();

const carListController = require("../controllers/carList");
const {auth}  = require("../middlewares/auth");

router.post("/", auth, carListController.createCarList);
router.get("/", auth, carListController.getCarLists);
router.get("/:id", auth, carListController.getCarListById);
router.put("/:id", auth, carListController.updateCarList);
router.delete("/:id", auth, carListController.deleteCarList);

module.exports = router;

