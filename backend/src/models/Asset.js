import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    assetTag: { type: String, required: true, unique: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'AssetCategory', required: true },
    serialNumber: { type: String, trim: true },
    acquisitionDate: { type: Date },
    acquisitionCost: { type: Number, min: 0 },
    condition: { type: String, trim: true },
    location: { type: String, trim: true },
    photos: [{ type: String }],
    isBookable: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Available', 'Allocated', 'Reserved', 'UnderMaintenance', 'Lost', 'Retired', 'Disposed'],
      default: 'Available',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Asset', assetSchema);
