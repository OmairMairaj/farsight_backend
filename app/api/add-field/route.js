import connectDB from '@/config/db';
import Category from '@/models/categoryModel';
import { corsHeaders } from '@/config/cors';

export async function PUT(req) {
    await connectDB();
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    try {
        const { fieldName, defaultValue } = await req.json(); // ✅ Field & Default Value

        if (!fieldName) {
            return new Response(JSON.stringify({ message: 'Field name is required' }), {
                headers: corsHeaders(origin),
                status: 400,
            });
        }

        // ✅ Debugging: Check if categories exist before update
        const categories = await Category.find({});
        console.log("📌 Categories in DB before update:", categories);

        if (categories.length === 0) {
            return new Response(JSON.stringify({ message: "No categories found in the database" }), {
                headers: corsHeaders(origin),
                status: 404,
            });
        }

        // ✅ Add the field to all records
        const result = await Category.updateMany({}, { $set: { [fieldName]: defaultValue } });
        console.log("✅ MongoDB Update Result:", result);

        if (result.modifiedCount === 0) {
            return new Response(JSON.stringify({ message: `No documents were modified. The field '${fieldName}' may already exist.` }), {
                headers: corsHeaders(origin),
                status: 200,
            });
        }

        return new Response(JSON.stringify({
            message: `Field '${fieldName}' added to all categories`,
            modifiedCount: result.modifiedCount
        }), {
            headers: corsHeaders(origin),
            status: 200,
        });

    } catch (error) {
        console.error('🚨 Error adding field:', error);
        return new Response(JSON.stringify({ message: 'Error adding field' }), {
            headers: corsHeaders(origin),
            status: 500,
        });
    }
}