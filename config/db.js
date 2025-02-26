import mongoose from 'mongoose';

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        console.log("MongoDB already connected");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("MongoDB Connected Successfully ✅");
    } catch (error) {
        console.error("MongoDB Connection Failed ❌", error);
        process.exit(1);
    }
};

export default connectDB;
