import mongoose from 'mongoose';

const StockSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to Product
    stock_type: { type: String, required: true, enum: ["Stock In", "Stock Out"] },
    quantity: { type: Number, required: true },
    unit_cost: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String },
    attachments: { type: [String], default: [] } // ✅ Stores Cloudinary receipt image URLs
});

const Stock = mongoose.models.Stock || mongoose.model("Stock", StockSchema);
export default Stock;