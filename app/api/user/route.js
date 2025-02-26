import connectDB from '@/config/db';
import User from '@/models/userModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { corsHeaders } from '@/config/cors';
import { authMiddleware } from '../../middleware';

export async function POST(req) {
    await connectDB();
    const origin = req.headers.origin;
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return new Response(JSON.stringify({ message: 'All fields are required' }), {
                headers: corsHeaders(origin),
                status: 400,
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return new Response(JSON.stringify({ message: 'User already exists' }), {
                headers: corsHeaders(origin),
                status: 400,
            });
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Plain Password:", password);
        console.log("Hashed Password:", hashedPassword);

        const newUser = await User.create({ name, email, password: hashedPassword });

        return new Response(JSON.stringify({ message: 'User registered successfully', data: newUser }), {
            headers: corsHeaders(origin),
            status: 201,
        });
    } catch (error) {
        console.error('🚨 Error registering user:', error.message);
        return new Response(JSON.stringify({ message: 'Server error' }), {
            headers: corsHeaders(origin),
            status: 500,
        });
    }
}

export async function PUT(req) {
    await connectDB();
    const origin = req.headers.origin;
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ message: 'Email and password are required' }), {
                headers: corsHeaders(origin),
                status: 400,
            });
        }

        console.log(email, password);

        // Find user and explicitly select password field
        const user = await User.findOne({ email }).select("+password");
        console.log(user);
        if (!user) {
            return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
                headers: corsHeaders(origin),
                status: 401,
            });
        }

        console.log("Entered Password:", password);
        console.log("Stored Hashed Password:", user.password);

        // Compare passwords securely
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password Match:", isMatch); // 👈 Log if passwords match
        if (!isMatch) {
            return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
                headers: corsHeaders(origin),
                status: 401,
            });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        return new Response(JSON.stringify({ _id: user._id, name: user.name, email: user.email, token, role: user.role }), {
            headers: corsHeaders(origin),
            status: 200,
        });
    } catch (error) {
        console.error('🚨 Error logging in:', error.message);
        return new Response(JSON.stringify({ message: 'Server error' }), {
            headers: corsHeaders(origin),
            status: 500,
        });
    }
}

export async function GET(req) {
    await connectDB();
    const origin = req.headers.origin;
    const authCheck = await authMiddleware(req);
    if (authCheck) return authCheck;

    return new Response(JSON.stringify({ _id: req.user._id, name: req.user.name, email: req.user.email }), {
        headers: corsHeaders(origin),
        status: 200,
    });
}

export async function DELETE(req) {
    await connectDB();
    const origin = req.headers.origin;
    const authCheck = await authMiddleware(req);
    if (authCheck) return authCheck;

    try {
        await User.findByIdAndDelete(req.user._id);
        return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
            headers: corsHeaders(origin),
            status: 200,
        });
    } catch (error) {
        console.error('🚨 Error deleting user:', error.message);
        return new Response(JSON.stringify({ message: 'Error deleting user' }), {
            headers: corsHeaders(origin),
            status: 500,
        });
    }
}

export async function OPTIONS(req) {
    const origin = req.headers.origin;
    return new Response(null, {
        headers: corsHeaders(origin),
        status: 204,
    });
}
