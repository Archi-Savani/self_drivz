const mongoose = require('mongoose');

// Location sub-schema
const locationSchema = new mongoose.Schema({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
    mode: { type: String, enum: ['manual', 'live'], required: true }
}, { _id: false });

const bookRideSchema = new mongoose.Schema({
    date: {
        from: { type: Date, required: true },
        to: { type: Date, required: true }
    },
    time: {
        from: { type: String, required: true },
        to: { type: String, required: true }
    },
    location: { type: locationSchema, required: true },
    status: {
        type: String,
        enum: ['cancelled', 'pending', 'complete', 'upcoming'],
        default: 'pending',
        required: true
    }
});

bookRideSchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('BookRide', bookRideSchema);
