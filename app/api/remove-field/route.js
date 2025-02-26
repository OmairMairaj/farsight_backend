import connectDB from '@/config/db';
import Product from '@/models/productModel';
import Category from '@/models/categoryModel';
import { corsHeaders } from '@/config/cors';

export async function PUT(req) {
    await connectDB();

    try {
        const { fieldName } = await req.json(); // ✅ Field to remove (passed from frontend)

        if (!fieldName) {
            return new Response(JSON.stringify({ message: 'Field name is required' }), {
                headers: corsHeaders(),
                status: 400,
            });
        }

        // ✅ Remove the field from all categories
        const result = await Category.updateMany({}, { $unset: { [fieldName]: 1 } });

        return new Response(JSON.stringify({
            message: `Field '${fieldName}' removed from all categories`,
            modifiedCount: result.modifiedCount
        }), {
            headers: corsHeaders(),
            status: 200,
        });

    } catch (error) {
        console.error('🚨 Error removing field:', error);
        return new Response(JSON.stringify({ message: 'Error removing field' }), {
            headers: corsHeaders(),
            status: 500,
        });
    }
}
