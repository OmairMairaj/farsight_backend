import connectDB from '@/config/db';
import { Category, Product } from '@/models/index';
import { corsHeaders } from '@/config/cors'; // ✅ Ensure CORS is handled

// ✅ Handle GET - Fetch products (with optional category filter)
export async function GET(req) {
    await connectDB();
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    try {
        // ✅ Extract `category` query parameter from request
        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get('category'); // Extract category ID from URL query

        let products;

        if (categoryId) {
            // ✅ If categoryId is provided, fetch products of that category
            products = await Product.find({ category_id: categoryId });
        } else {
            // ✅ If no categoryId, fetch all products
            products = await Product.find({});
        }

        return new Response(JSON.stringify(products), {
            headers: corsHeaders(origin),
            status: 200,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return new Response(JSON.stringify({ message: 'Error fetching products' }), {
            headers: corsHeaders(origin),
            status: 500,
        });
    }
}

export async function POST(req) {
    await connectDB();
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    try {
        const body = await req.json();

        // ✅ Validate required fields
        if (!body.model || !body.category_id || !body.type || !body.unit_cost) {
            const missingFields = [];

            if (!body.model) missingFields.push("Model");
            if (!body.category_id) missingFields.push("Category ID");
            if (!body.type) missingFields.push("Type");
            if (!body.unit_cost) missingFields.push("Unit Cost");

            return new Response(JSON.stringify({
                message: `Missing required fields: ${missingFields.join(", ")}`,
                missingFields // ✅ Include missing fields array for debugging
            }), {
                headers: corsHeaders(origin),
                status: 400,
            });
        }

        // ✅ Construct new product
        const newProduct = new Product({
            model: body.model,
            image_path: body.image_path || null, // Optional Image (Base64)
            type: body.type || 'N/A',
            deflection: body.deflection || '-',
            quantity: 0,
            supplier: body.supplier || 'Unknown',
            unit_cost: body.unit_cost || 0,
            comments: body.comments || '',
            category_id: body.category_id, // Reference to Category
        });

        // ✅ Save product to database
        const savedProduct = await newProduct.save();

        // ✅ Update category to add new product's ID
        const updatedCategory = await Category.findByIdAndUpdate(
            body.category_id,
            { $push: { products: savedProduct._id } }, // Add product ID to category
            { new: true }
        );

        if (!updatedCategory) {
            return new Response(JSON.stringify({ message: 'Category not found' }), {
                headers: corsHeaders(origin),
                status: 404,
            });
        }

        return new Response(JSON.stringify({
            message: 'Product added successfully',
            product: savedProduct
        }), {
            headers: corsHeaders(origin),
            status: 201,
        });

    } catch (error) {
        console.error('Error adding product:', error);
        return new Response(JSON.stringify({ message: 'Error adding product' }), {
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
