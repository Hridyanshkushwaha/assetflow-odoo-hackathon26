import mongoose from 'mongoose';

const transferRequestSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    fromHolder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toHolder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'Rejected'],
      default: 'Requested',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('TransferRequest', transferRequestSchema);
