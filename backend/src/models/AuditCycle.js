import mongoose from 'mongoose';

const auditCycleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    scopeDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    scopeLocation: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    auditors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  },
  { timestamps: true }
);

export default mongoose.model('AuditCycle', auditCycleSchema);
