const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const userRoutes = require("./routes/user");
const carRoutes = require("./routes/car");
const adminOfferRoutes = require("./routes/adminOffer");
const adminBannerRoutes = require("./routes/adminBanner");
const kycRoutes = require("./routes/kyc");
const privacyRoutes = require("./routes/privacy");
const termsRoutes = require("./routes/terms");
const rideRoutes = require("./routes/ride");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/user", userRoutes);
app.use("/api/car", carRoutes);
app.use("/api/adminOffer", adminOfferRoutes);
app.use("/api/adminBanner", adminBannerRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/privacy", privacyRoutes);
app.use("/api/terms", termsRoutes);
app.use("/api/ride", rideRoutes);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_CONNECTION_STRING);
        console.log("MongoDB connected successfully.");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        process.exit(1);
    }
};

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});
