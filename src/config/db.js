const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        const dbName = process.env.MONGO_DB_NAME || 'RetroTrade';
        await mongoose.connect(uri, { dbName });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error("MongoDB connection failed: ", error);
        throw error;
    }
};

module.exports = connectDB;