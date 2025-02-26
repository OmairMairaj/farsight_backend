import connectDB from '@/config/db';
import { Category, Product, Stock } from '@/models/index';
import { corsHeaders } from '@/config/cors';

export async function PUT(req, { params }) {
    await connectDB();

    try {
        const id = req.nextUrl.pathname.split('/').pop(); // ✅ Extract category ID from request URL
        const { category_name, category_image_path, comments } = await req.json();

        if (!id) {
            return new Response(JSON.stringify({ message: 'Category ID is required' }), {
                status: 400,
                headers: corsHeaders(),
            });
        }

        // ✅ Find the category by ID
        const category = await Category.findById(id);

        if (!category) {
            return new Response(JSON.stringify({ message: 'Category not found' }), {
                status: 404,
                headers: corsHeaders(),
            });
        }

        // ✅ Update category fields
        category.category_name = category_name || category.category_name;
        category.comments = comments || category.comments;

        // ✅ If a new image is uploaded (Base64), update the image path
        if (category_image_path != category.category_image_path) {
            category.category_image_path = category_image_path;
        }

        await category.save(); // ✅ Save updated category

        return new Response(JSON.stringify(category), {
            status: 200,
            headers: corsHeaders(),
        });

    } catch (error) {
        console.error('Error updating category:', error);
        return new Response(JSON.stringify({ message: 'Error updating category' }), {
            status: 500,
            headers: corsHeaders(),
        });
    }
}

export async function DELETE(req, context) {
    await connectDB();

    try {
        const { id } = context.params; // ✅ Extract category ID

        if (!id) {
            return new Response(JSON.stringify({ message: 'Category ID is required' }), {
                status: 400,
                headers: corsHeaders(),
            });
        }

        console.log("🗑️ Deleting Category with ID:", id);

        // ✅ Step 1: Find the category first
        const category = await Category.findById(id);
        if (!category) {
            console.log("❌ Category not found.");
            return new Response(JSON.stringify({ message: 'Category not found' }), {
                status: 404,
                headers: corsHeaders(),
            });
        }

        console.log("📦 Category Found:", category);

        // ✅ Step 2: Delete Category Image from Cloudinary (if exists)
        if (category.category_image_path) {
            const imageUrlParts = category.category_image_path.split('/');
            const filenameWithExt = imageUrlParts.pop(); // Extract filename with extension
            const filename = filenameWithExt.split('.')[0]; // Remove file extension
            const publicId = `${filename}`;

            console.log("🗑️ Deleting Category Image from Cloudinary:", publicId);

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/delete-image?public_id=${publicId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();
                if (response.status !== 200) {
                    console.error(`❌ Failed to delete category image: ${publicId}`, data.message);
                } else {
                    console.log(`✅ Successfully deleted category image: ${publicId}`);
                }
            } catch (error) {
                console.error(`🚨 Error deleting category image: ${publicId}`, error);
            }
        }

        // ✅ Step 3: Find all products under this category
        const products = await Product.find({ category_id: id });

        if (products.length > 0) {
            console.log(`🔄 Found ${products.length} products under this category.`);

            for (const product of products) {
                console.log("🛒 Deleting product:", product.model);

                // ✅ Step 4: Delete Product Image from Cloudinary (if exists)
                if (product.image_path) {
                    const imageUrlParts = product.image_path.split('/');
                    const filenameWithExt = imageUrlParts.pop(); // Extract filename with extension
                    const filename = filenameWithExt.split('.')[0]; // Remove file extension
                    const publicId = `${filename}`;

                    console.log("🗑️ Deleting Product Image from Cloudinary:", publicId);

                    try {
                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/delete-image?public_id=${publicId}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                        });

                        const data = await response.json();
                        if (response.status !== 200) {
                            console.error(`❌ Failed to delete product image: ${publicId}`, data.message);
                        } else {
                            console.log(`✅ Successfully deleted product image: ${publicId}`);
                        }
                    } catch (error) {
                        console.error(`🚨 Error deleting product image: ${publicId}`, error);
                    }
                }

                // ✅ Step 5: Find all stock entries for this product
                const relatedStocks = await Stock.find({ product_id: product._id });

                if (relatedStocks.length > 0) {
                    console.log(`📊 Found ${relatedStocks.length} stock entries for product:`, product.model);

                    // ✅ Extract Cloudinary public IDs for deletion
                    const publicIds = relatedStocks.flatMap(stock => stock.attachments.map(url => {
                        const parts = url.split('/');
                        const filenameWithExt = parts.pop(); // Get filename with extension
                        const lastDotIndex = filenameWithExt.lastIndexOf(".");
                        // const filename = filenameWithExt.split('.')[-1]; // Remove extension
                        const filename = lastDotIndex !== -1 ? filenameWithExt.slice(0, lastDotIndex) : filenameWithExt;
                        const isPDForDocx = filenameWithExt.endsWith('.pdf') || filenameWithExt.endsWith('.docx') || filenameWithExt.endsWith('.doc');

                        // ✅ For images, remove extensions in public_id
                        // ✅ For PDFs/DOCs, keep the extension
                        return isPDForDocx
                            ? `${parts.pop()}/${filenameWithExt}` // PDFs & DOCX keep the extension
                            : `${parts.pop()}/${filename}`;
                    }));

                    console.log("🗑️ Cloudinary Public IDs to Delete:", publicIds);

                    // ✅ Call Cloudinary delete API for each image
                    await Promise.all(publicIds.map(async (publicId) => {
                        try {
                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/delete-attachment?public_id=${publicId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });

                            const data = await response.json();
                            if (response.status !== 200) {
                                console.error(`❌ Failed to delete Cloudinary image: ${publicId}`, data.message);
                            } else {
                                console.log(`✅ Successfully deleted Cloudinary image: ${publicId}`);
                            }
                        } catch (error) {
                            console.error(`🚨 Error deleting Cloudinary image: ${publicId}`, error);
                        }
                    }));

                    console.log("✅ Cloudinary images deleted successfully.");

                    // ✅ Delete all stock entries for this product
                    const deletedStocks = await Stock.deleteMany({ product_id: product._id });

                    if (deletedStocks.deletedCount === 0) {
                        console.log("⚠️ Failed to delete stocks for product:", product.model);
                        return new Response(JSON.stringify({ message: 'Error deleting stock records' }), {
                            status: 500,
                            headers: corsHeaders(),
                        });
                    }

                    console.log(`🗑️ Deleted ${deletedStocks.deletedCount} stock entries for product:`, product.model);
                } else {
                    console.log(`✅ No stock entries found for product:`, product.model);
                }
            }

            // ✅ Delete all products under this category
            const deletedProducts = await Product.deleteMany({ category_id: id });

            if (deletedProducts.deletedCount === 0) {
                console.log("⚠️ Failed to delete products under this category.");
                return new Response(JSON.stringify({ message: 'Error deleting products' }), {
                    status: 500,
                    headers: corsHeaders(),
                });
            }

            console.log(`🗑️ Deleted ${deletedProducts.deletedCount} products under this category.`);
        } else {
            console.log("✅ No products found under this category.");
        }

        // ✅ Finally, delete the category itself
        const deletedCategory = await Category.findByIdAndDelete(id);

        if (!deletedCategory) {
            console.log("⚠️ Failed to delete the category.");
            return new Response(JSON.stringify({ message: 'Error deleting category' }), {
                status: 500,
                headers: corsHeaders(),
            });
        }

        console.log("✅ Category Deleted Successfully!");

        return new Response(JSON.stringify({
            message: 'Category, products, and stocks deleted successfully',
            deletedProducts: products.length,
            deletedStocks: products.reduce((acc, product) => acc + product.quantity, 0), // Total stock records deleted
        }), {
            status: 200,
            headers: corsHeaders(),
        });

    } catch (error) {
        console.error('🚨 Error deleting category:', error);
        return new Response(JSON.stringify({ message: 'Error deleting category' }), {
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
