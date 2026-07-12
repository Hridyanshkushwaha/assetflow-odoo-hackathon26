import mongoose from 'mongoose';

const auditItemSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    result: {
      type: String,
      enum: ['pending', 'verified', 'missing', 'damaged'],
      default: 'pending',
    },
    notes: { type: String },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
  },
  { _id: true }
);

const auditCycleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    scopeType: { type: String, enum: ['department', 'location'], required: true },
    scopeDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    scopeLocation: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    auditors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    items: [auditItemSchema],
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('AuditCycle', auditCycleSchema);
