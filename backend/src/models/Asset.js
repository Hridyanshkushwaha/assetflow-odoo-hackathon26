import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'AssetCategory', required: true },
    assetTag: { type: String, required: true, unique: true },
    serialNumber: { type: String, trim: true },
    acquisitionDate: { type: Date },
    acquisitionCost: { type: Number, min: 0 },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
      default: 'good',
    },
    location: { type: String, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    photos: [{ type: String }],
    documents: [{ type: String }],
    isBookable: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['available', 'allocated', 'reserved', 'under_maintenance', 'lost', 'retired', 'disposed'],
      default: 'available',
    },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Asset', assetSchema);
