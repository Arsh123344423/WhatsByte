import mongoose from 'mongoose';

const mappingSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' },
  assigned_at: { type: Date, default: Date.now }
}, { timestamps: true });

// Prevent duplicate assignment of the same doctor to the same patient
mappingSchema.index({ patient: 1, doctor: 1 }, { unique: true });

export default mongoose.model('Mapping', mappingSchema);
