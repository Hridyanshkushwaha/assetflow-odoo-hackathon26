import mongoose from 'mongoose';

const maintenanceRequestSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    photos: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'technician_assigned', 'in_progress', 'resolved'],
      default: 'pending',
    },
    technician: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
