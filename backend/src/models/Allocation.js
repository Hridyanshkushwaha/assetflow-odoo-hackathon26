import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    allocatedTo: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'allocatedToType' },
    allocatedToType: { type: String, enum: ['User', 'Department'], required: true },
    allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expectedReturnDate: { type: Date },
    actualReturnDate: { type: Date },
    conditionCheckInNotes: { type: String },
    status: {
      type: String,
      enum: ['Active', 'Returned', 'Overdue'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Allocation', allocationSchema);
