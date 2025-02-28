import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    model: { type: String, required: true },
    image_path: { type: String, default: null },
    type: { type: String, required: true },
    deflection: { type: String, default: '-' },
    quantity: { type: Number, default: 0 },
    supplier: { type: String, default: '' },
    unit_cost: { type: Number, required: true, default: 0 },
    comments: { type: String, default: '' },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
});

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export default Product;
