import connectDB from "@/config/db";
import User from "@/models/userModel";
import bcrypt from "bcrypt";
import { corsHeaders } from "@/config/cors";

// ✅ Handle CORS preflight requests
export async function OPTIONS() {
    return new Response(null, {
        headers: corsHeaders(),
        status: 204,
    });
}

// ✅ Connect to Database
export async function PUT(req) {
    await connectDB();

    try {
        const { password } = await req.json();

        console.log(password);

        if (!password) {
            return new Response(JSON.stringify({ message: "Admin password is required" }), {
                headers: corsHeaders(),
                status: 400,
            });
        }

        // ✅ Find Admin User
        const user = await User.findOne({ role: 'admin' }).select("+password");

        console.log(user);
        if (!user || user.role !== "admin") {
            return new Response(JSON.stringify({ message: "Unauthorized request" }), {
                headers: corsHeaders(),
                status: 401,
            });
        }

        // ✅ Compare Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return new Response(JSON.stringify({ message: "Incorrect password" }), {
                headers: corsHeaders(),
                status: 401,
            });
        }

        return new Response(JSON.stringify({ message: "Password verified" }), {
            headers: corsHeaders(),
            status: 200,
        });

    } catch (error) {
        console.error("🚨 Error verifying admin:", error.message);
        return new Response(JSON.stringify({ message: "Server error" }), {
            headers: corsHeaders(),
            status: 500,
        });
    }
}
