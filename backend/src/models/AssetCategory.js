import mongoose from 'mongoose';

const assetCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    extraFields: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

export default mongoose.model('AssetCategory', assetCategorySchema);
