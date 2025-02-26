import connectDB from '@/config/db';
import Stock from '@/models/stockModel';
import Product from '@/models/productModel';
import { corsHeaders } from '@/config/cors';

export async function PUT(req, context) {
    await connectDB();
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    try {
        const { stockId } = await context.params; // ✅ Directly access params without await
        console.log("🛠️ Stock ID from Params:", stockId);

        const { quantity, unit_cost, date, description, attachments } = await req.json();

        if (quantity === undefined || quantity === null || quantity === '' || unit_cost === undefined || unit_cost === null || unit_cost === '') {
            return new Response(JSON.stringify({ message: 'Quantity and Unit Cost are required' }), {
                headers: corsHeaders(origin),
                status: 400,
            });
        }

        const stockEntry = await Stock.findById(stockId);
        if (!stockEntry) {
            return new Response(JSON.stringify({ message: 'Stock entry not found' }), {
                headers: corsHeaders(origin),
                status: 404,
            });
        }

        console.log("✅ Stock Entry Found:", stockEntry);

        const product = await Product.findById(stockEntry.product_id);
        if (!product) {
            return new Response(JSON.stringify({ message: 'Product not found' }), {
                headers: corsHeaders(origin),
                status: 404,
            });
        }

        console.log("🛒 Product Before Update:", product);

        const quantityDiff = quantity - stockEntry.quantity;

        if (stockEntry.stock_type === "Stock In") {
            product.quantity += quantityDiff;
        } else {
            product.quantity -= quantityDiff;
        }

        if (product.quantity < 0) {
            return new Response(JSON.stringify({ message: 'Stock cannot be negative' }), {
                headers: corsHeaders(origin),
                status: 400,
            });
        }

        console.log("🔄 Updating Product Quantity:", product.quantity);

        stockEntry.quantity = quantity;
        stockEntry.unit_cost = unit_cost;
        stockEntry.date = new Date(date);
        stockEntry.description = description;
        stockEntry.attachments = attachments;

        await Promise.all([stockEntry.save(), product.save()]);

        console.log("✅ Stock Updated Successfully!");

        return new Response(JSON.stringify({
            message: 'Stock entry updated successfully',
            stock: stockEntry,
            product
        }), {
            headers: corsHeaders(origin),
            status: 200,
        });

    } catch (error) {
        console.error('🚨 Error updating stock entry:', error);
        return new Response(JSON.stringify({ message: 'Error updating stock entry' }), {
            headers: corsHeaders(origin),
            status: 500,
        });
    }
}

export async function DELETE(req, { params }) {
    await connectDB();
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    try {
        const stockId = params?.stockId || params?.id; // Ensure correct ID extraction
        console.log("🗑️ Deleting Stock with ID:", stockId);

        if (!stockId) {
            return new Response(JSON.stringify({ message: 'Stock ID is required' }), {
                headers: corsHeaders(origin),
                status: 400,
            });
        }

        const stock = await Stock.findById(stockId);
        if (!stock) {
            console.log("❌ Stock entry not found.");
            return new Response(JSON.stringify({ message: 'Stock entry not found' }), {
                headers: corsHeaders(origin),
                status: 404,
            });
        }

        console.log("📦 Stock Found:", stock);

        // ✅ Find the associated product
        const product = await Product.findById(stock.product_id);
        if (!product) {
            console.log("❌ Product not found.");
            return new Response(JSON.stringify({ message: 'Product not found' }), {
                headers: corsHeaders(origin),
                status: 404,
            });
        }

        console.log("🛒 Product Before Deletion:", product);

        // ✅ Adjust product quantity before deleting stock
        if (stock.stock_type === "Stock In") {
            product.quantity -= stock.quantity;
        } else {
            product.quantity += stock.quantity;
        }

        // ✅ Prevent negative stock
        if (product.quantity < 0) {
            console.log("❌ Stock cannot be negative.");
            return new Response(JSON.stringify({ message: 'Stock cannot be negative' }), {
                headers: corsHeaders(origin),
                status: 400,
            });
        }

        console.log("🔄 Updating Product Quantity:", product.quantity);

        // ✅ Delete stock entry & update product
        await Promise.all([
            Stock.findByIdAndDelete(stockId),
            product.save()
        ]);

        console.log("✅ Stock Deleted Successfully!");

        return new Response(JSON.stringify({
            message: 'Stock entry deleted successfully',
            product: { quantity: product.quantity }
        }), {
            headers: corsHeaders(origin),
            status: 200,
        });

    } catch (error) {
        console.error('🚨 Error deleting stock entry:', error);
        return new Response(JSON.stringify({ message: 'Error deleting stock entry' }), {
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
