import mongoose from 'mongoose';

export const connectToDatabase = async (databaseUrl) => {
    try {
        const conn = await mongoose.connect(databaseUrl);
        console.log(`Connected to MongoDB: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};
