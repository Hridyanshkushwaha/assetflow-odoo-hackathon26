import mongoose from 'mongoose';

const maintenanceRequestSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issueDescription: { type: String, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    photo: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'TechnicianAssigned', 'InProgress', 'Resolved'],
      default: 'Pending',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    technicianName: { type: String },
    resolutionNotes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
