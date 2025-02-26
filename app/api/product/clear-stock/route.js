import connectDB from '@/config/db';
import Product from '@/models/productModel';
import { corsHeaders } from '@/config/cors';

export async function DELETE(req) {
    await connectDB();
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    try {
        // ✅ Find all products
        const products = await Product.find({});

        if (products.length === 0) {
            return new Response(JSON.stringify({ message: 'No products found.' }), {
                headers: corsHeaders(origin),
                status: 404,
            });
        }

        // ✅ Loop through each product and remove stock_data
        const updatedProducts = await Promise.all(
            products.map(async (product) => {
                product.stock_data = []; // ✅ Clear stock_data array
                return await product.save(); // ✅ Save updated product
            })
        );

        return new Response(JSON.stringify({
            message: `Stock data cleared from ${updatedProducts.length} products.`,
            products: updatedProducts
        }), {
            headers: corsHeaders(origin),
            status: 200,
        });

    } catch (error) {
        console.error('Error deleting stock data:', error);
        return new Response(JSON.stringify({ message: 'Error deleting stock data' }), {
            headers: corsHeaders(origin),
            status: 500,
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
