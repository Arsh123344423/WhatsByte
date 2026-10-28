import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  specialization: { type: String, required: true, trim: true },
  contact_number: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  years_of_experience: { type: Number, default: 0, min: 0 },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Doctor', doctorSchema);
