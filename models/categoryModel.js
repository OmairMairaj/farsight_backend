import mongoose from 'mongoose';
import './productModel.js'; // ✅ Ensure Product model is loaded before Category

const CategorySchema = new mongoose.Schema({
    category_name: { type: String, required: true },
    category_image_path: { type: String, default: '' },
    comments: { type: String, default: '' },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] // Reference Product IDs
});

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
export default Category;
