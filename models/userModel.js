import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Define User Schema
const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: 3,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/.+@.+\..+/, "Invalid email format"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
            select: false
        },
        role: {
            type: String,
            enum: ["admin", "user"], // Restrict roles to predefined values
            default: "user",
        },
    },
    { timestamps: true } // Automatically adds `createdAt` & `updatedAt`
);

// Create and export User model
const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
