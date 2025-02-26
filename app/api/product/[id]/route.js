import connectDB from '@/config/db';
import Product from '@/models/productModel';
import Stock from '@/models/stockModel';
import { corsHeaders } from '@/config/cors';

export async function GET(req, { params }) {
    await connectDB();

    try {
        const { id } = await params; // ✅ Await params.id properly
        const productId = id; // ✅ Await params.id properly

        // ✅ Validate required fields
        if (!productId) {
            return new Response(JSON.stringify({ message: 'Product ID is required' }), {
                headers: corsHeaders(),
                status: 400,
            });
        }

        const product = await Product.findById(productId).populate({
            path: 'category_id',
            model: 'Category', // ✅ Explicitly reference Category model
            select: 'category_name', // ✅ Fetch only needed fields
        });

        if (!product) {
            return new Response(JSON.stringify({ message: 'Product not found' }), {
                headers: corsHeaders(),
                status: 404,
            });
        }

        return new Response(JSON.stringify(product), {
            headers: corsHeaders(),
            status: 200,
        });

    } catch (error) {
        console.error('Error fetching product:', error);
        return new Response(JSON.stringify({ message: 'Error fetching product' }), {
            headers: corsHeaders(),
            status: 500,
        });
    }
}

export async function PUT(req, { params }) {
    await connectDB();

    try {
        const { id } = await params; // ✅ Await params.id properly
        const productId = id; // ✅ Await params.id properly
        const body = await req.json();

        // ✅ Validate required fields
        if (!productId) {
            return new Response(JSON.stringify({ message: 'Product ID is required' }), {
                headers: corsHeaders(),
                status: 400,
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { $set: body }, // ✅ Update all fields provided in the body
            { new: true } // ✅ Return updated product
        );

        if (!updatedProduct) {
            return new Response(JSON.stringify({ message: 'Product not found' }), {
                headers: corsHeaders(),
                status: 404,
            });
        }

        return new Response(JSON.stringify({ message: 'Product updated successfully', product: updatedProduct }), {
            headers: corsHeaders(),
            status: 200,
        });

    } catch (error) {
        console.error('Error updating product:', error);
        return new Response(JSON.stringify({ message: 'Error updating product' }), {
            headers: corsHeaders(),
            status: 500,
        });
    }
}

// ✅ Delete Product by ID API (Ensures all related stock data is deleted)
export async function DELETE(req, context) {
    await connectDB();

    try {
        const { id: productId } = context.params; // ✅ Extract product ID properly
        console.log("🗑️ Deleting Product with ID:", productId); // ✅ Debugging

        // ✅ Validate that the product ID exists
        if (!productId) {
            return new Response(JSON.stringify({ message: 'Product ID is required' }), {
                headers: corsHeaders(),
                status: 400,
            });
        }

        // ✅ Find the product to ensure it exists
        const product = await Product.findById(productId);
        if (!product) {
            console.log("❌ Product not found.");
            return new Response(JSON.stringify({ message: 'Product not found' }), {
                headers: corsHeaders(),
                status: 404,
            });
        }

        console.log("📦 Product Found:", product);

        // ✅ Step 1: Delete Product Image from Cloudinary (if exists)
        if (product.image_path) {
            const imageUrlParts = product.image_path.split('/');
            const filenameWithExt = imageUrlParts.pop(); // Extract filename with extension
            const filename = filenameWithExt.split('.')[0]; // Remove file extension
            const publicId = `${filename}`;

            console.log("🗑️ Deleting Product Image from Cloudinary:", publicId);

            console.log("DELETE PRODUCT IMAGE API URL:", `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/delete-image?public_id=${publicId}`);

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/delete-image?public_id=${publicId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
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

        // ✅ Step 2: Find all related stock entries
        const relatedStocks = await Stock.find({ product_id: productId });

        if (relatedStocks.length > 0) {
            console.log(`🔄 Found ${relatedStocks.length} stock entries. Deleting images first...`);

            // ✅ Extract Cloudinary public IDs
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

            // ✅ Call Cloudinary delete API for each image using fetch
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
        }

        // ✅ Delete all related stock entries
        const deletedStock = await Stock.deleteMany({ product_id: productId });
        console.log(`🗑️ Deleted ${deletedStock.deletedCount} stock entries`);

        // ✅ Ensure all related stock records were deleted before deleting the product
        const deletedProduct = await Product.findByIdAndDelete(productId);
        if (!deletedProduct) {
            console.log("❌ Failed to delete product.");
            return new Response(JSON.stringify({ message: 'Error deleting product' }), {
                headers: corsHeaders(),
                status: 500,
            });
        }

        console.log("✅ Product Deleted Successfully!");

        return new Response(JSON.stringify({
            message: 'Product and related stock entries deleted successfully',
            deletedStockCount: deletedStock.deletedCount,
        }), {
            headers: corsHeaders(),
            status: 200,
        });

    } catch (error) {
        console.error('🚨 Error deleting product:', error);
        return new Response(JSON.stringify({ message: 'Error deleting product' }), {
            headers: corsHeaders(),
            status: 500,
        });
    }
}


// ✅ Handle CORS for preflight requests
export async function OPTIONS() {
    return new Response(null, {
        headers: corsHeaders(),
        status: 204,
    });
}

