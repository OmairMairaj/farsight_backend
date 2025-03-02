import connectDB from '@/config/db';
import { Category } from '@/models/index';
import { corsHeaders } from '@/config/cors';

export async function PATCH(req) {
    await connectDB();
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";

    try {
        // ✅ Find all categories and convert `order` fields to Number
        const categories = await Category.find({});
        let updatedCount = 0;

        for (const category of categories) {
            if (typeof category.order !== "number") {
                await Category.updateOne({ _id: category._id }, { $set: { order: Number(category.order) } });
                updatedCount++;
            }
        }

        return new Response(JSON.stringify({
            message: `✅ Fixed ${updatedCount} categories with incorrect order type.`,
        }), {
            status: 200,
            headers: corsHeaders(origin),
        });

    } catch (error) {
        console.error("🚨 Error fixing order field:", error);
        return new Response(JSON.stringify({ message: "Error fixing order field", error: error.message }), {
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

