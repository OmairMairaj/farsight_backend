import connectDB from "@/config/db";
import User from "@/models/userModel";
import bcrypt from "bcrypt";
import { corsHeaders } from "@/config/cors";

// ✅ Handle CORS preflight requests
export async function OPTIONS(req) {
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    return new Response(null, {
        headers: corsHeaders(origin),
        status: 204,
    });
}

// ✅ Connect to Database
export async function PUT(req) {
    await connectDB();
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    try {
        const { password } = await req.json();

        console.log(password);

        if (!password) {
            return new Response(JSON.stringify({ message: "Admin password is required" }), {
                headers: corsHeaders(origin),
                status: 400,
            });
        }

        // ✅ Find Admin User
        const user = await User.findOne({ role: 'admin' }).select("+password");

        console.log(user);
        if (!user || user.role !== "admin") {
            return new Response(JSON.stringify({ message: "Unauthorized request" }), {
                headers: corsHeaders(origin),
                status: 401,
            });
        }

        // ✅ Compare Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return new Response(JSON.stringify({ message: "Incorrect password" }), {
                headers: corsHeaders(origin),
                status: 401,
            });
        }

        return new Response(JSON.stringify({ message: "Password verified" }), {
            headers: corsHeaders(origin),
            status: 200,
        });

    } catch (error) {
        console.error("🚨 Error verifying admin:", error.message);
        return new Response(JSON.stringify({ message: "Server error" }), {
            headers: corsHeaders(origin),
            status: 500,
        });
    }
}
