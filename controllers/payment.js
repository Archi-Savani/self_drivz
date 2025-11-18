const Payment = require("../models/payment");

const createPayment = async (req, res) => {
    try {
        const { Amount } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: user not found in request",
            });
        }

        if (Amount === undefined || Amount === null) {
            return res.status(400).json({
                success: false,
                message: "Amount is required",
            });
        }

        const numericAmount = Number(Amount);
        if (Number.isNaN(numericAmount) || numericAmount < 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be a valid positive number",
            });
        }

        const userName = String(user.name || "").trim();
        const userEmail = String(user.email || "").trim().toLowerCase();
        const contact = String(user.phone || "").trim();

        const paymentPayload = {
            userName,
            userEmail,
            contact,
            Amount: numericAmount,
        };

        const payment = await Payment.create(paymentPayload);

        res.status(201).json({
            success: true,
            message: "Payment recorded successfully",
            data: payment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create payment",
            error: error.message,
        });
    }
};

module.exports = {
    createPayment,
};

