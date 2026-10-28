import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import User from './models/User.js';
import Patient from './models/Patient.js';
import Doctor from './models/Doctor.js';
import Mapping from './models/Mapping.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'healthcare-super-secret-key-2026';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthcare_db';

// MongoDB Connection with caching for Serverless environments (like Vercel)
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB Connected Successfully');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
  }
}
connectDB();

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Authentication credentials were not provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ status: 'error', message: 'Given token is invalid or expired.' });
    }
    req.user = user;
    next();
  });
};

/* ---------------- 1. AUTHENTICATION APIS ---------------- */

// POST /api/auth/register/
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'User with this email already exists.' });
    }

    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password });
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully.',
      user: { id: user._id, name: user.name, email: user.email },
      tokens: { access: token, refresh: token },
      token
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/auth/login/
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ status: 'error', message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Login successful.',
      user: { id: user._id, name: user.name, email: user.email },
      tokens: { access: token, refresh: token },
      token
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/* ---------------- 2. PATIENT MANAGEMENT APIS ---------------- */

// POST /api/patients/ (Add patient)
app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.create({ ...req.body, created_by: req.user.id });
    res.status(201).json({ message: 'Patient created successfully.', patient });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// GET /api/patients/ (Retrieve user's patients)
app.get('/api/patients', authenticateToken, async (req, res) => {
  try {
    const patients = await Patient.find({ created_by: req.user.id }).sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/patients/:id
app.get('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, created_by: req.user.id });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found.' });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ status: 'error', message: 'Invalid patient ID.' });
  }
});

// PUT /api/patients/:id
app.put('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, created_by: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found.' });
    res.json({ message: 'Patient updated successfully.', patient });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// DELETE /api/patients/:id
app.delete('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ _id: req.params.id, created_by: req.user.id });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found.' });
    await Mapping.deleteMany({ patient: req.params.id });
    res.json({ message: 'Patient deleted successfully.' });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/* ---------------- 3. DOCTOR MANAGEMENT APIS ---------------- */

// POST /api/doctors/
app.post('/api/doctors', authenticateToken, async (req, res) => {
  try {
    const doctor = await Doctor.create({ ...req.body, created_by: req.user.id });
    res.status(201).json({ message: 'Doctor created successfully.', doctor });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// GET /api/doctors/
app.get('/api/doctors', authenticateToken, async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/doctors/:id
app.get('/api/doctors/:id', authenticateToken, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ status: 'error', message: 'Doctor not found.' });
    res.json(doctor);
  } catch (err) {
    res.status(400).json({ status: 'error', message: 'Invalid doctor ID.' });
  }
});

// PUT /api/doctors/:id
app.put('/api/doctors/:id', authenticateToken, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doctor) return res.status(404).json({ status: 'error', message: 'Doctor not found.' });
    res.json({ message: 'Doctor updated successfully.', doctor });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// DELETE /api/doctors/:id
app.delete('/api/doctors/:id', authenticateToken, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ status: 'error', message: 'Doctor not found.' });
    await Mapping.deleteMany({ doctor: req.params.id });
    res.json({ message: 'Doctor deleted successfully.' });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

/* ---------------- 4. PATIENT-DOCTOR MAPPINGS APIS ---------------- */

// POST /api/mappings/ (Assign doctor to patient)
app.post('/api/mappings', authenticateToken, async (req, res) => {
  try {
    const patientId = req.body.patient_id || req.body.patient;
    const doctorId = req.body.doctor_id || req.body.doctor;

    const existing = await Mapping.findOne({ patient: patientId, doctor: doctorId });
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'This doctor is already assigned to this patient.' });
    }

    const mapping = await Mapping.create({
      patient: patientId,
      doctor: doctorId,
      notes: req.body.notes || '',
      assigned_by: req.user.id
    });

    const populated = await Mapping.findById(mapping._id).populate('patient').populate('doctor');
    res.status(201).json({ message: 'Doctor assigned to patient successfully.', mapping: populated });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// GET /api/mappings/ (All mappings)
app.get('/api/mappings', authenticateToken, async (req, res) => {
  try {
    const mappings = await Mapping.find().populate('patient').populate('doctor').sort({ assigned_at: -1 });
    res.json(mappings);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/mappings/:patientId (Doctors assigned to patient)
app.get('/api/mappings/:patientId', authenticateToken, async (req, res) => {
  try {
    const mappings = await Mapping.find({ patient: req.params.patientId }).populate('doctor');
    res.json({
      patient_id: req.params.patientId,
      total_assigned_doctors: mappings.length,
      assigned_doctors: mappings.map(m => ({
        mapping_id: m._id,
        doctor: m.doctor,
        notes: m.notes,
        assigned_at: m.assigned_at
      }))
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// DELETE /api/mappings/:id
app.delete('/api/mappings/:id', authenticateToken, async (req, res) => {
  try {
    const mapping = await Mapping.findByIdAndDelete(req.params.id);
    if (!mapping) return res.status(404).json({ status: 'error', message: 'Mapping record not found.' });
    res.json({ message: 'Successfully removed doctor from patient.' });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`MongoDB Backend Server running on port ${PORT}`));
}

export default app;
