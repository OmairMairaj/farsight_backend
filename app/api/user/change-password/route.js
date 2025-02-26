import connectDB from '@/config/db';
import User from '@/models/userModel';
import bcrypt from 'bcrypt';
import { authMiddleware } from '../../../middleware';
import { corsHeaders } from '@/config/cors';

export async function PUT(req) {
    await connectDB();
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";

    // ✅ Get user from authMiddleware instead of modifying req
    const user = await authMiddleware(req);
    if (user instanceof Response) return user; // If auth fails, return response

    try {
        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return new Response(JSON.stringify({ message: 'Both fields are required' }), {
                headers: corsHeaders(origin),
                status: 400,
            });
        }

        // ✅ Find user using the `user` object from middleware
        const foundUser = await User.findById(user._id).select("+password");

        if (!foundUser) {
            return new Response(JSON.stringify({ message: 'User not found' }), {
                headers: corsHeaders(origin),
                status: 404,
            });
        }

        // ✅ Compare current password
        const isMatch = await bcrypt.compare(currentPassword, foundUser.password);
        if (!isMatch) {
            return new Response(JSON.stringify({ message: 'Current password is incorrect' }), {
                headers: corsHeaders(origin),
                status: 401,
            });
        }

        // ✅ Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // ✅ Update the password
        foundUser.password = hashedNewPassword;
        await foundUser.save();

        return new Response(JSON.stringify({ message: 'Password updated successfully' }), {
            headers: corsHeaders(origin),
            status: 200,
        });
    } catch (error) {
        console.error('🚨 Error changing password:', error.message);
        return new Response(JSON.stringify({ message: 'Server error' }), {
            headers: corsHeaders(origin),
            status: 500,
        });
    }
}

export async function OPTIONS(req) {
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    return new Response(null, {
        headers: corsHeaders(origin),
        status: 204,
    });
}
