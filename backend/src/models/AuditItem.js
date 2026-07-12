import mongoose from 'mongoose';

const auditItemSchema = new mongoose.Schema(
  {
    auditCycle: { type: mongoose.Schema.Types.ObjectId, ref: 'AuditCycle', required: true },
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    result: {
      type: String,
      enum: ['Verified', 'Missing', 'Damaged'],
      default: 'Verified',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('AuditItem', auditItemSchema);
