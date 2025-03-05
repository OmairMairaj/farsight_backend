import connectDB from '@/config/db';
import { Category, Product } from '@/models/index';
import { corsHeaders } from '@/config/cors'; // ✅ Ensure CORS is handled

export async function PUT(req) {
    await connectDB();
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";

    try {
        const result = await Product.updateMany({}, { $set: { quantity: 0 } });

        return new Response(JSON.stringify({
            message: 'All product quantities reset to 0.',
            product: result.modifiedCount
        }), {
            headers: corsHeaders(origin),
            status: 200,
        });


    } catch (error) {
        console.error('🚨 Error resetting product quantities:', error);
        return new Response(JSON.stringify({ message: 'Error resetting product quantities', error: error.message }), {
            status: 500,
            headers: corsHeaders(origin),
        });
    }
}



// ✅ Handle CORS for preflight requests
export async function OPTIONS(req) {
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    return new Response(null, {
        headers: corsHeaders(origin),
        status: 204,
    });
}
