import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, trim: true, unique: true, uppercase: true },
    head: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    parentDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

export default mongoose.model('Department', departmentSchema);
