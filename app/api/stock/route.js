import connectDB from '@/config/db';
import Product from '@/models/productModel';
import Stock from '@/models/stockModel';
import { corsHeaders } from '@/config/cors';
import mongoose from 'mongoose';

export async function GET(req) {
    await connectDB();

    try {
        // ✅ Extract `product_id` from query parameters
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('product_id');

        if (!productId) {
            return new Response(JSON.stringify({ message: 'Product ID is required' }), {
                headers: corsHeaders(),
                status: 400,
            });
        }

        // ✅ Fetch stocks related to the product ID
        const stocks = await Stock.find({ product_id: productId }).sort({ date: -1 });

        return new Response(JSON.stringify(stocks), {
            headers: corsHeaders(),
            status: 200,
        });

    } catch (error) {
        console.error('Error fetching stocks:', error);
        return new Response(JSON.stringify({ message: 'Error fetching stocks' }), {
            headers: corsHeaders(),
            status: 500,
        });
    }
}

export async function POST(req) {
    await connectDB();
    const session = await mongoose.startSession(); // ✅ Start a transaction

    try {
        session.startTransaction(); // ✅ Begin transaction

        const body = await req.json();
        body.quantity = Number(body.quantity);
        body.unit_cost = Number(body.unit_cost);

        if (!body.product_id || !body.stock_type || isNaN(body.quantity) || body.quantity <= 0 || isNaN(body.unit_cost) || body.unit_cost <= 0) {
            await session.abortTransaction();
            session.endSession();
            return new Response(JSON.stringify({ message: 'Missing or invalid fields' }), {
                headers: corsHeaders(),
                status: 400,
            });
        }

        const product = await Product.findById(body.product_id).session(session);
        if (!product) {
            await session.abortTransaction();
            session.endSession();
            return new Response(JSON.stringify({ message: 'Product not found' }), {
                headers: corsHeaders(),
                status: 404,
            });
        }

        if (body.stock_type === "Stock Out" && product.quantity < body.quantity) {
            await session.abortTransaction();
            session.endSession();
            return new Response(JSON.stringify({ message: 'Not enough stock available' }), {
                headers: corsHeaders(),
                status: 400,
            });
        }

        // ✅ Ensure attachments are a **flat array of strings**
        const attachments = body.attachments?.flat() || [];

        console.log("🖼️ Attachments Before Save:", attachments); // ✅ Debug Attachments

        const newStock = new Stock({
            product_id: body.product_id,
            stock_type: body.stock_type,
            quantity: body.quantity,
            unit_cost: body.unit_cost,
            description: body.description || '',
            attachments, // ✅ Save uploaded image URLs properly
        });

        await newStock.save({ session });

        // ✅ Adjust product quantity
        if (body.stock_type === "Stock In") {
            product.quantity += body.quantity;
        } else {
            product.quantity -= body.quantity;
        }

        console.log("🔢 Before Save: Product Quantity:", product.quantity);
        await product.save({ session });
        console.log("✅ After Save: Product Quantity:", product.quantity);

        await session.commitTransaction(); // ✅ Commit transaction
        session.endSession(); // ✅ End session

        return new Response(JSON.stringify({
            message: 'Stock added successfully',
            stock: newStock,
            product
        }), {
            headers: corsHeaders(),
            status: 201,
        });

    } catch (error) {
        await session.abortTransaction(); // ✅ Rollback on error
        session.endSession();
        console.error('🚨 Error adding stock:', error);
        return new Response(JSON.stringify({ message: 'Error adding stock' }), {
            headers: corsHeaders(),
            status: 500,
        });
    }
}

// ✅ Handle CORS for preflight requests
export async function OPTIONS() {
    return new Response(null, {
        headers: corsHeaders(),
        status: 204,
    });
}
