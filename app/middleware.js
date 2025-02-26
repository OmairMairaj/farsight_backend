import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import { NextResponse } from 'next/server';

export async function authMiddleware(req) {
    const token = req.headers.get('authorization')?.split(' ')[1];

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized, no token' }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return user; // ✅ Return the user instead of modifying req
    } catch (error) {
        return NextResponse.json({ message: 'Invalid token', error: error.message }, { status: 401 });
    }
}