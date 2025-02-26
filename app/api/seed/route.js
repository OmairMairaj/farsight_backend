import connectDB from '@/config/db';
// import { Category, Product } from '../model';
import Category from '@/models/categoryModel';
import Product from '@/models/productModel';

export async function POST(req) {
    await connectDB();

    try {
        const body = await req.json(); // Parse request body

        for (const category of body) {
            // Check if category exists
            let existingCategory = await Category.findOne({ category_name: category.category_name });

            if (!existingCategory) {
                existingCategory = new Category({
                    category_name: category.category_name,
                    category_image_path: category.category_image_path || '',
                    products: [] // Initialize empty array for products
                });
                await existingCategory.save();
            }

            // Insert products and store their ObjectIds in category.products
            const productIds = [];
            for (const product of category.products) {
                let existingProduct = await Product.findOne({ model: product.model });

                if (!existingProduct) {
                    existingProduct = new Product({
                        ...product,
                        category_id: existingCategory._id, // Link product to category ObjectId
                    });
                    await existingProduct.save();
                }

                // ✅ **Fix: Push only ObjectId, not full product object**
                productIds.push(existingProduct._id);
            }

            // Update category with correct product ObjectIds
            existingCategory.products = productIds;
            await existingCategory.save();
        }

        return new Response(JSON.stringify({ message: 'Data seeded successfully!' }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error inserting data:', error);
        return new Response(JSON.stringify({ message: 'Error seeding data' }), {
            status: 500,
        });
    }
}

export async function DELETE() {
    await connectDB();
    try {
        // Delete all documents from collections
        await Category.deleteMany({});
        await Product.deleteMany({});

        return new Response(JSON.stringify({ message: 'Database cleared successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error clearing database:', error);
        return new Response(JSON.stringify({ message: 'Error clearing database' }), {
            status: 500,
        });
    }
}
