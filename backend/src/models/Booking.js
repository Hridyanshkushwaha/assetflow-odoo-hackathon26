import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

bookingSchema.index({ asset: 1, startTime: 1, endTime: 1 });

export default mongoose.model('Booking', bookingSchema);
