const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const userRoutes = require("./routes/user");
const carRoutes = require("./routes/car");
const adminRoutes = require("./routes/admin");
const adminOfferRoutes = require("./routes/adminOffer");
const adminBannerRoutes = require("./routes/adminBanner");
const riderKycRoutes = require("./routes/riderKyc");
const fleetOwnerKycRoutes = require("./routes/fleetOwnerKyc");
const privacyRoutes = require("./routes/privacy");
const termsRoutes = require("./routes/terms");
const rideRoutes = require("./routes/ride");
const adventureRoutes = require("./routes/adventure");
const ratingReviewRoutes = require("./routes/ratingReview");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// jhbjhb
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/car", carRoutes);
app.use("/api/adminOffer", adminOfferRoutes);
app.use("/api/adminBanner", adminBannerRoutes);
app.use("/api/rider-kyc", riderKycRoutes);
app.use("/api/kyc-fleet-owner", fleetOwnerKycRoutes);
app.use("/api/privacy", privacyRoutes);
app.use("/api/terms", termsRoutes);
app.use("/api/ride", rideRoutes);
app.use("/api/adventures", adventureRoutes);
app.use("/api/rating-review", ratingReviewRoutes);

const connectDB = async () => {
    try {
        if (!process.env.DB_CONNECTION_STRING) {
            console.error("Error: DB_CONNECTION_STRING is not defined in .env file");
            console.error("Please create a .env file with the following variables:");
            console.error("  DB_CONNECTION_STRING=your_mongodb_connection_string");
            console.error("  JWT_SECRET=your_jwt_secret");
            console.error("  CLOUD_NAME=your_cloudinary_cloud_name");
            console.error("  CLOUD_API_KEY=your_cloudinary_api_key");
            console.error("  CLOUD_API_SECRET=your_cloudinary_api_secret");
            process.exit(1);
        }
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
