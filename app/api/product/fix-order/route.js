import connectDB from '@/config/db';
import { Product } from '@/models/index';
import { corsHeaders } from '@/config/cors';

export async function PATCH(req) {
    await connectDB();
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";

    try {
        // ✅ Get all unique category IDs from products
        const categoryIds = await Product.distinct("category_id");

        let updatedCount = 0;

        for (const categoryId of categoryIds) {
            // ✅ Find all products in this category and sort them by `_id`
            const products = await Product.find({ category_id: categoryId }).sort({ _id: 1 });

            console.log(`{Products for category ${categoryId}: ${products}}`);

            // ✅ Assign `order` field sequentially
            for (let i = 0; i < products.length; i++) {
                await Product.updateOne(
                    { _id: products[i]._id },
                    { $set: { order: i + 1 } } // Order starts from 1
                );
                updatedCount++;
                console.log(`{Updated product ${products[i]._id} with order ${i + 1}}`);
                console.log("Updated Product", products[i])
            }
        }

        return new Response(JSON.stringify({
            message: `✅ Order field added/updated for ${updatedCount} products.`,
        }), {
            status: 200,
            headers: corsHeaders(origin),
        });

    } catch (error) {
        console.error('🚨 Error updating product order:', error);
        return new Response(JSON.stringify({ message: 'Error updating product order' }), {
            status: 500,
            headers: corsHeaders(origin),
        });
    }
}

// ✅ Handle CORS for preflight requests
export async function OPTIONS(req) {
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
    });
}
