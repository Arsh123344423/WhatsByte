import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 1, max: 150 },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  contact_number: { type: String, required: true },
  address: { type: String, required: true },
  medical_history: { type: String, default: '' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Patient', patientSchema);
