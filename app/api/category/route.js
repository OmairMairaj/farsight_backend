import connectDB from '@/config/db';
import { Category } from '@/models/index';
import { corsHeaders } from '@/config/cors';

export async function GET(req) {
    await connectDB();
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    try {
        const categories = await Category.find().populate('products').sort({ order: 1 });
        return new Response(JSON.stringify(categories), {
            status: 200,
            headers: corsHeaders(origin),
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        return new Response(JSON.stringify({ message: 'Error fetching categories' }), {
            status: 500,
            headers: corsHeaders(origin),
        });
    }
}

// ✅ Create a new category (POST API)
export async function POST(req) {
    await connectDB();
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    try {
        const { category_name, category_image_path, comments } = await req.json();

        // ✅ Check for required fields
        if (!category_name) {
            return new Response(JSON.stringify({ message: 'Category name is required' }), {
                status: 400,
                headers: corsHeaders(origin),
            });
        }

        // ✅ Find max order and increment it for the new category
        const lastCategory = await Category.findOne().sort({ order: -1 });
        const newOrder = lastCategory ? lastCategory.order + 1 : 1;

        // ✅ Create and save the new category
        const newCategory = new Category({
            category_name,
            category_image_path: category_image_path || '', // Default empty string if no image
            comments: comments || '',
            products: [], // Initialize empty array for products
            order: newOrder,
        });

        await newCategory.save();

        return new Response(JSON.stringify(newCategory), {
            status: 201,
            headers: corsHeaders(origin),
        });

    } catch (error) {
        console.error('Error adding category:', error);
        return new Response(JSON.stringify({ message: 'Error adding category' }), {
            status: 500,
            headers: corsHeaders(origin),
        });
    }
}

export async function PUT(req) {
    await connectDB();
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";

    try {
        const { reorderedCategories } = await req.json();

        if (!Array.isArray(reorderedCategories)) {
            return new Response(JSON.stringify({ message: "Invalid data format" }), {
                status: 400,
                headers: corsHeaders(origin),
            });
        }

        // Step 1️⃣: **Set temporary unique values to prevent duplicate key error**
        const tempBulkOps = reorderedCategories.map((category, index) => ({
            updateOne: {
                filter: { _id: category._id },
                update: { $set: { order: -1 * (index + 1) } } // Set negative unique values
            }
        }));

        await Category.bulkWrite(tempBulkOps);

        // Step 2️⃣: **Reassign proper `order` values**
        const bulkOps = reorderedCategories.map((category, index) => ({
            updateOne: {
                filter: { _id: category._id },
                update: { $set: { order: index + 1 } } // Ensure unique order values
            }
        }));

        await Category.bulkWrite(bulkOps);

        return new Response(JSON.stringify({ message: "Categories reordered successfully" }), {
            status: 200,
            headers: corsHeaders(origin),
        });

    } catch (error) {
        console.error('🚨 Error reordering categories:', error);
        return new Response(JSON.stringify({ message: 'Error reordering categories', error: error.message }), {
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
