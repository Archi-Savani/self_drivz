const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment");
const { auth } = require("../middlewares/auth");

// Payment creation endpoint (requires authenticated user)
router.post("/", auth, paymentController.createPayment);

module.exports = router;

