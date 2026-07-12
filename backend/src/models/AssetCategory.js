import mongoose from 'mongoose';

const customFieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'date'], default: 'text' },
    value: { type: String },
  },
  { _id: false }
);

const assetCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    customFields: [customFieldSchema],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('AssetCategory', assetCategorySchema);
