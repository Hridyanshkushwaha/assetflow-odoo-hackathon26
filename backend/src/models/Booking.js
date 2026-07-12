import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
      default: 'Upcoming',
    },
  },
  { timestamps: true }
);

bookingSchema.index({ resource: 1, startTime: 1, endTime: 1 });

export default mongoose.model('Booking', bookingSchema);
