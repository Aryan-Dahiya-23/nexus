import mongoose from 'mongoose';

export const connectToDatabase = async (databaseUrl) => {
    try {
        const conn = await mongoose.connect(databaseUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`Connected to MongoDB: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};