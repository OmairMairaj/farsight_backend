import connectDB from '@/config/db';
import { Category } from '@/models/index';
import { corsHeaders } from '@/config/cors';

export async function GET() {
    await connectDB();

    try {
        const categories = await Category.find().populate('products');
        return new Response(JSON.stringify(categories), {
            status: 200,
            headers: corsHeaders(),
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        return new Response(JSON.stringify({ message: 'Error fetching categories' }), {
            status: 500,
            headers: corsHeaders(),
        });
    }
}

// ✅ Create a new category (POST API)
export async function POST(req) {
    await connectDB();

    try {
        const { category_name, category_image_path, comments } = await req.json();

        // ✅ Check for required fields
        if (!category_name) {
            return new Response(JSON.stringify({ message: 'Category name is required' }), {
                status: 400,
                headers: corsHeaders(),
            });
        }

        // ✅ Create and save the new category
        const newCategory = new Category({
            category_name,
            category_image_path: category_image_path || '', // Default empty string if no image
            comments: comments || '',
            products: [], // Initialize empty array for products
        });

        await newCategory.save();

        return new Response(JSON.stringify(newCategory), {
            status: 201,
            headers: corsHeaders(),
        });

    } catch (error) {
        console.error('Error adding category:', error);
        return new Response(JSON.stringify({ message: 'Error adding category' }), {
            status: 500,
            headers: corsHeaders(),
        });
    }
}

// ✅ Handle CORS for preflight requests
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(),
    });
}
