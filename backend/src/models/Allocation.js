import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    allocatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    allocatedToDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    expectedReturnDate: { type: Date },
    status: {
      type: String,
      enum: ['active', 'returned', 'overdue', 'transfer_pending'],
      default: 'active',
    },
    conditionNotes: { type: String },
    allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    returnedAt: { type: Date },
    returnNotes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Allocation', allocationSchema);
