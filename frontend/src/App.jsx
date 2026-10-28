import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Heart, 
  Stethoscope, 
  UserCheck, 
  Users, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ArrowUpRight, 
  X, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  Server, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Filter, 
  FolderHeart, 
  ClipboardList, 
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';

import { 
  authAPI, 
  patientAPI, 
  doctorAPI, 
  mappingAPI, 
  getToken, 
  getUser 
} from './services/api';

export default function App() {
  const [scrollY, setScrollY] = useState(0);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Current authenticated user & role
  const [currentUser, setCurrentUser] = useState(getUser() || null);

  // Active Role View for public interface: 'doctor' | 'patient'
  const [activeRole, setActiveRole] = useState(getUser()?.role && getUser()?.role !== 'admin' ? getUser().role : 'patient');

  // URL Path router state
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Dedicated Admin session & credentials state (at /admin)
  const [adminSessionAuthenticated, setAdminSessionAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin@hospital.com');
  const [adminPassword, setAdminPassword] = useState('AdminPass123!');
  const [adminError, setAdminError] = useState('');

  // Login form state for public modal
  const [authEmail, setAuthEmail] = useState('patient.eleanor@hospital.com');
  const [authPassword, setAuthPassword] = useState('PatientPass123!');
  const [authName, setAuthName] = useState('Eleanor Vance');
  const [authRole, setAuthRole] = useState('patient');

  // Backend sync status
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');

  // Live database records from Django + PostgreSQL
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [mappings, setMappings] = useState([]);

  // Filter states
  const [doctorSpecialtyFilter, setDoctorSpecialtyFilter] = useState('All');
  const [searchDoctor, setSearchDoctor] = useState('');
  const [activeAdminSubTab, setActiveAdminSubTab] = useState('overview'); // 'overview' | 'patients' | 'doctors' | 'mappings'

  // Form states for Admin
  const [newPatient, setNewPatient] = useState({ 
    name: '', age: '', gender: 'Female', contact_number: '', address: '', medical_history: '' 
  });
  const [newDoctor, setNewDoctor] = useState({ 
    name: '', specialization: '', contact_number: '', email: '', years_of_experience: '' 
  });
  const [newMapping, setNewMapping] = useState({ 
    patient_id: '', doctor_id: '', notes: '' 
  });

  const triggerNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4500);
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch all live data from Django
  const fetchData = async () => {
    setLoading(true);
    try {
      const rootRes = await fetch('http://127.0.0.1:8000/').catch(() => null);
      setBackendOnline(Boolean(rootRes && rootRes.ok));

      // Fetch patients, doctors, and mappings
      const [patientsRes, doctorsRes, mappingsRes] = await Promise.all([
        patientAPI.listAll().catch(() => patientAPI.list().catch(() => [])),
        doctorAPI.list().catch(() => []),
        mappingAPI.list().catch(() => [])
      ]);

      if (Array.isArray(patientsRes)) setPatients(patientsRes);
      if (Array.isArray(doctorsRes)) setDoctors(doctorsRes);
      if (Array.isArray(mappingsRes)) setMappings(mappingsRes);

      if (Array.isArray(patientsRes) && patientsRes.length > 0 && !newMapping.patient_id) {
        setNewMapping(prev => ({
          ...prev,
          patient_id: String(patientsRes[0].id),
          doctor_id: doctorsRes?.[0]?.id ? String(doctorsRes[0].id) : ''
        }));
      }
    } catch (err) {
      console.warn("Backend sync notice:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Synchronize active role with user role on login
  const handleRoleSwitch = (role) => {
    setActiveRole(role);
    triggerNotify(`Switched to ${role.toUpperCase()} Workspace view.`);
  };

  // Quick 1-click login presets
  const handleQuickLogin = async (email, password, role) => {
    setLoading(true);
    try {
      const res = await authAPI.login(email, password);
      const userWithRole = { ...res.user, role: role || res.user.role || 'admin' };
      setCurrentUser(userWithRole);
      setActiveRole(userWithRole.role);
      triggerNotify(`Logged in as ${userWithRole.name} [${userWithRole.role.toUpperCase()}]!`);
      setAuthModalOpen(false);
      setConsoleOpen(true);
      await fetchData();
    } catch (err) {
      // Fallback for offline or local preview
      const fallbackUser = {
        id: role === 'admin' ? 1 : role === 'doctor' ? 2 : 3,
        name: role === 'admin' ? 'Chief Admin Dr. Alex Morgan' : role === 'doctor' ? 'Dr. Sarah Jenkins' : 'Eleanor Vance',
        email,
        role
      };
      setCurrentUser(fallbackUser);
      setActiveRole(role);
      setAuthModalOpen(false);
      setConsoleOpen(true);
      triggerNotify(`Switched to demo ${role.toUpperCase()} mode.`);
    } finally {
      setLoading(false);
    }
  };

  // Clean initial patient & doctor registration states (demands user input)
  const [patientRegAge, setPatientRegAge] = useState('');
  const [patientRegGender, setPatientRegGender] = useState('');
  const [patientRegPhone, setPatientRegPhone] = useState('');
  const [patientRegHistory, setPatientRegHistory] = useState('');

  const [doctorRegSpec, setDoctorRegSpec] = useState('');
  const [doctorRegExp, setDoctorRegExp] = useState('');
  const [doctorRegPhone, setDoctorRegPhone] = useState('');

  // Handle browser path changes
  useEffect(() => {
    const onLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    if (path === '/admin') {
      setActiveRole('admin');
      setAdminError('');
    } else {
      if (activeRole === 'admin') {
        setActiveRole('patient');
      }
    }
  };

  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setAdminError('');
    try {
      const res = await authAPI.login(adminEmail, adminPassword);
      const user = { ...res.user, role: res.user.role || 'admin' };
      if (user.role !== 'admin') {
        setAdminError(`Access Denied: Account '${user.email}' is registered as ${user.role.toUpperCase()}, not an administrator.`);
        setLoading(false);
        return;
      }
      setCurrentUser(user);
      setActiveRole('admin');
      setAdminSessionAuthenticated(true);
      triggerNotify(`Welcome, Chief Administrator ${user.name}!`);
      await fetchData();
    } catch (err) {
      if (adminEmail === 'admin@hospital.com' && adminPassword === 'AdminPass123!') {
        const fallbackAdmin = {
          id: 1,
          name: 'Chief Admin Dr. Alex Morgan',
          email: 'admin@hospital.com',
          role: 'admin'
        };
        setCurrentUser(fallbackAdmin);
        setActiveRole('admin');
        setAdminSessionAuthenticated(true);
        triggerNotify('Logged in as Chief Admin (Demo Mode).');
        await fetchData();
      } else {
        setAdminError(err.message || 'Invalid administrator email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminQuickLogin = async () => {
    setAdminEmail('admin@hospital.com');
    setAdminPassword('AdminPass123!');
    setLoading(true);
    setAdminError('');
    try {
      const res = await authAPI.login('admin@hospital.com', 'AdminPass123!');
      const user = { ...res.user, role: 'admin' };
      setCurrentUser(user);
      setActiveRole('admin');
      setAdminSessionAuthenticated(true);
      triggerNotify(`Welcome, Administrator ${user.name}!`);
      await fetchData();
    } catch (err) {
      const fallbackAdmin = {
        id: 1,
        name: 'Chief Admin Dr. Alex Morgan',
        email: 'admin@hospital.com',
        role: 'admin'
      };
      setCurrentUser(fallbackAdmin);
      setActiveRole('admin');
      setAdminSessionAuthenticated(true);
      triggerNotify('Switched to Chief Admin (Demo Mode).');
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogout = () => {
    authAPI.logout();
    setCurrentUser(null);
    setAdminSessionAuthenticated(false);
    triggerNotify('Logged out from Admin session.');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'login') {
        const res = await authAPI.login(authEmail, authPassword);
        const user = { ...res.user, role: res.user.role || authRole };
        setCurrentUser(user);
        setActiveRole(user.role);
        triggerNotify(`Welcome back, ${user.name}!`);
      } else {
        const res = await authAPI.register(authName, authEmail, authPassword, authRole);
        const user = { ...res.user, role: authRole };
        setCurrentUser(user);
        setActiveRole(authRole);

        // If registered as a patient, validate and create personal Patient EHR record
        if (authRole === 'patient') {
          if (!patientRegAge || !patientRegGender) {
            triggerNotify("Please enter your age and select Male or Female to complete registration.");
            setLoading(false);
            return;
          }

          try {
            await patientAPI.create({
              name: authName.trim(),
              age: parseInt(patientRegAge, 10),
              gender: patientRegGender,
              contact_number: patientRegPhone || 'Pending',
              address: 'Registered via Patient Portal',
              medical_history: patientRegHistory || 'Initial Clinical Intake'
            });
            triggerNotify(`Registration complete! Welcome ${authName} (${patientRegAge} yrs, ${patientRegGender}). Please select your doctor.`);
          } catch (patErr) {
            console.warn("Patient profile auto-create notice:", patErr);
          }
        } else if (authRole === 'doctor') {
          // If registered as a doctor, validate and register into PostgreSQL Faculty
          if (!doctorRegSpec || !doctorRegExp || !doctorRegPhone) {
            triggerNotify("Please provide your specialty, clinical experience, and phone number.");
            setLoading(false);
            return;
          }

          try {
            await doctorAPI.create({
              name: authName.trim(),
              specialization: doctorRegSpec.trim(),
              contact_number: doctorRegPhone.trim(),
              email: authEmail.trim(),
              years_of_experience: parseInt(doctorRegExp, 10) || 0
            });
            triggerNotify(`Registration complete! Welcome Dr. ${authName} (${doctorRegSpec}). Your patient bucket is active.`);
          } catch (docErr) {
            console.warn("Doctor profile auto-create notice:", docErr);
          }
        } else {
          triggerNotify(`Account registered successfully as ${authRole.toUpperCase()}!`);
        }
      }
      setAuthModalOpen(false);
      setConsoleOpen(true);
      await fetchData();
    } catch (err) {
      triggerNotify(`Auth Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setCurrentUser(null);
    triggerNotify('Logged out from session.');
  };

  // Patient Actions: Pick Doctor (Patient self-assignment)
  const handlePatientPickDoctor = async (doctorId, doctorName) => {
    let patientObj = patients.find(p => p.created_by?.id === currentUser?.id || p.created_by?.email === currentUser?.email) || currentPatientRecord;

    try {
      let patientId = patientObj?.id;
      // If patient record is not in database yet, create it on the fly
      if (!patientId || !patients.some(p => p.id === patientId)) {
        const createdPat = await patientAPI.create({
          name: currentUser.name || 'New Patient',
          age: parseInt(patientRegAge, 10) || 30,
          gender: patientRegGender,
          contact_number: patientRegPhone,
          address: 'Registered via Patient Portal',
          medical_history: patientRegHistory
        });
        patientId = createdPat.patient?.id || createdPat.id;
      }

      await mappingAPI.assign({
        patient_id: patientId,
        doctor_id: doctorId,
        notes: `Direct consultation requested by patient ${currentUser?.name || ''}`
      });
      triggerNotify(`Success! Dr. ${doctorName} has been assigned to your medical team.`);
      fetchData();
    } catch (err) {
      triggerNotify(`Assignment Notice: ${err.message}`);
    }
  };

  // Admin Actions
  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newPatient.name,
        age: parseInt(newPatient.age, 10),
        gender: newPatient.gender,
        contact_number: newPatient.contact_number,
        address: newPatient.address,
        medical_history: newPatient.medical_history || ''
      };
      const res = await patientAPI.create(payload);
      triggerNotify(`Patient "${res.patient.name}" enrolled into PostgreSQL.`);
      setNewPatient({ name: '', age: '', gender: 'Female', contact_number: '', address: '', medical_history: '' });
      fetchData();
    } catch (err) {
      triggerNotify(`Error: ${err.message}`);
    }
  };

  const handleDeletePatient = async (id) => {
    try {
      await patientAPI.delete(id);
      triggerNotify("Patient record deleted from database.");
      fetchData();
    } catch (err) {
      triggerNotify(`Error: ${err.message}`);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newDoctor.name,
        specialization: newDoctor.specialization,
        contact_number: newDoctor.contact_number,
        email: newDoctor.email,
        years_of_experience: parseInt(newDoctor.years_of_experience, 10) || 0
      };
      const res = await doctorAPI.create(payload);
      triggerNotify(`Dr. ${res.doctor.name} added to PostgreSQL faculty roster.`);
      setNewDoctor({ name: '', specialization: '', contact_number: '', email: '', years_of_experience: '' });
      fetchData();
    } catch (err) {
      triggerNotify(`Error: ${err.message}`);
    }
  };

  const handleDeleteDoctor = async (id) => {
    try {
      await doctorAPI.delete(id);
      triggerNotify("Doctor record removed from database.");
      fetchData();
    } catch (err) {
      triggerNotify(`Error: ${err.message}`);
    }
  };

  const handleAddMapping = async (e) => {
    e.preventDefault();
    try {
      await mappingAPI.assign({
        patient_id: parseInt(newMapping.patient_id, 10),
        doctor_id: parseInt(newMapping.doctor_id, 10),
        notes: newMapping.notes || ''
      });
      triggerNotify("Doctor successfully assigned to patient!");
      setNewMapping(prev => ({ ...prev, notes: '' }));
      fetchData();
    } catch (err) {
      triggerNotify(`Error: ${err.message}`);
    }
  };

  const handleDeleteMapping = async (id) => {
    try {
      await mappingAPI.remove(id);
      triggerNotify("Assignment removed.");
      fetchData();
    } catch (err) {
      triggerNotify(`Error: ${err.message}`);
    }
  };

  // Derive Doctor's own record strictly matching authenticated user
  const currentDoctorRecord = doctors.find(d => 
    d.email?.toLowerCase() === currentUser?.email?.toLowerCase() || 
    d.created_by?.id === currentUser?.id ||
    d.name?.toLowerCase() === currentUser?.name?.toLowerCase()
  ) || (currentUser?.role === 'doctor' ? {
    id: currentUser.id,
    name: currentUser.name,
    specialization: currentUser.specialization || doctorRegSpec || 'Specialist Physician',
    years_of_experience: currentUser.years_of_experience || doctorRegExp || 5,
    email: currentUser.email
  } : null);

  // Derive Doctor's Bucket (strictly patients assigned to THIS doctor)
  const doctorBucket = currentDoctorRecord?.id 
    ? mappings.filter(m => 
        m.doctor?.id === currentDoctorRecord.id || 
        m.doctor_id === currentDoctorRecord.id ||
        m.doctor?.email?.toLowerCase() === currentDoctorRecord.email?.toLowerCase()
      )
    : [];

  // Derive Patient's own record strictly matching authenticated user
  const currentPatientRecord = patients.find(p => 
    p.created_by?.id === currentUser?.id || 
    p.created_by?.email === currentUser?.email ||
    (currentUser?.role === 'patient' && p.created_by?.email === currentUser?.email)
  ) || (currentUser?.role === 'patient' ? {
    id: currentUser.id,
    name: currentUser.name,
    age: currentUser.age || 30,
    gender: currentUser.gender || 'Not specified',
    contact_number: currentUser.contact_number || 'Pending',
    medical_history: currentUser.medical_history || 'New Patient Enrollment'
  } : null);

  // Derive Patient's Assigned Doctors (strictly for THIS logged in patient)
  const patientAssignedDoctors = currentPatientRecord?.id
    ? mappings.filter(m => m.patient?.id === currentPatientRecord.id || m.patient_id === currentPatientRecord.id)
    : [];

  // Filtered doctor list for Patient browsing
  const filteredDoctors = doctors.filter(doc => {
    const matchesSpec = doctorSpecialtyFilter === 'All' || doc.specialization.toLowerCase().includes(doctorSpecialtyFilter.toLowerCase());
    const matchesSearch = doc.name.toLowerCase().includes(searchDoctor.toLowerCase()) || doc.specialization.toLowerCase().includes(searchDoctor.toLowerCase());
    return matchesSpec && matchesSearch;
  });

  const renderClimbingLetters = (text, delayOffset = 0) => {
    return text.split('').map((char, index) => (
      <span
        key={index}
        className="letter-animated"
        style={{
          animationDelay: `${delayOffset + index * 32}ms`,
          display: char === ' ' ? 'inline' : 'inline-block'
        }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  const renderAdminDashboardContent = () => (
    <div>
      {/* Real-time KPI Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 32
      }}>
        <div style={{ background: '#fff', border: '1px solid var(--hairline)', padding: 18 }}>
          <span className="label-caps" style={{ fontSize: 9.5, color: 'var(--ink-muted)' }}>ACTIVE PATIENTS</span>
          <p className="font-display" style={{ fontSize: 32, fontWeight: 600, color: 'var(--rust)', marginTop: 4 }}>
            {patients.length}
          </p>
          <span style={{ fontSize: 11, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }}></span>
            Under active surveillance
          </span>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--hairline)', padding: 18 }}>
          <span className="label-caps" style={{ fontSize: 9.5, color: 'var(--ink-muted)' }}>DOCTORS ON DUTY</span>
          <p className="font-display" style={{ fontSize: 32, fontWeight: 600, color: 'var(--ink)', marginTop: 4 }}>
            {doctors.length}
          </p>
          <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4, display: 'block' }}>
            Credentialed faculty
          </span>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--hairline)', padding: 18 }}>
          <span className="label-caps" style={{ fontSize: 9.5, color: 'var(--ink-muted)' }}>CARE MAPPINGS</span>
          <p className="font-display" style={{ fontSize: 32, fontWeight: 600, color: 'var(--teal)', marginTop: 4 }}>
            {mappings.length}
          </p>
          <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4, display: 'block' }}>
            Active clinical referrals
          </span>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--hairline)', padding: 18 }}>
          <span className="label-caps" style={{ fontSize: 9.5, color: 'var(--ink-muted)' }}>SYSTEM UPTIME</span>
          <p className="font-mono" style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink)', marginTop: 6 }}>
            99.99%
          </p>
          <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4, display: 'block' }}>
            PostgreSQL ACID live
          </span>
        </div>
      </div>

      {/* Admin Subtabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--hairline)', marginBottom: 24 }}>
        {[
          { id: 'overview', label: 'Real-Time Monitoring Feed' },
          { id: 'patients', label: `Manage Patients (${patients.length})` },
          { id: 'doctors', label: `Manage Doctors (${doctors.length})` },
          { id: 'mappings', label: `Manage Care Mappings (${mappings.length})` }
        ].map(sub => (
          <button
            key={sub.id}
            onClick={() => setActiveAdminSubTab(sub.id)}
            style={{
              padding: '12px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeAdminSubTab === sub.id ? '2px solid var(--rust)' : '2px solid transparent',
              fontWeight: activeAdminSubTab === sub.id ? 700 : 500,
              color: activeAdminSubTab === sub.id ? 'var(--rust)' : 'var(--ink-muted)',
              cursor: 'pointer',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* Overview Feed */}
      {activeAdminSubTab === 'overview' && (
        <div>
          <h4 className="font-display" style={{ fontSize: 18, marginBottom: 16 }}>Live Clinical Routing Grid</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mappings.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', fontStyle: 'italic', padding: 20, background: '#fff', border: '1px solid var(--hairline)' }}>No clinical directives or doctor assignments recorded yet.</p>
            ) : mappings.map(m => (
              <div key={m.id} style={{
                background: '#fff',
                border: '1px solid var(--hairline)',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 600 }}>{m.patient?.name || m.patient_name}</span>
                    <span style={{ color: 'var(--rust)' }}>➔</span>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Dr. {m.doctor?.name || m.doctor_name}</span>
                    <span style={{ fontSize: 10, background: 'var(--rust-light)', color: 'var(--rust)', padding: '2px 8px', fontWeight: 600 }}>
                      {m.doctor?.specialization || m.doctor_spec}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
                    Directives: {m.notes || 'Routine physician surveillance'}
                  </p>
                </div>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>
                  Assigned {new Date(m.assigned_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Patient CRUD */}
      {activeAdminSubTab === 'patients' && (
        <div>
          <form onSubmit={handleAddPatient} style={{ background: '#fff', border: '1px solid var(--hairline)', padding: 18, marginBottom: 24 }}>
            <span className="label-caps" style={{ color: 'var(--rust)', display: 'block', marginBottom: 12 }}>Enroll New Patient</span>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input type="text" placeholder="Patient Full Name" required value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} style={{ padding: '8px 12px', border: '1px solid var(--hairline)', fontSize: 13 }} />
              <input type="number" placeholder="Age" required value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} style={{ padding: '8px 12px', border: '1px solid var(--hairline)', fontSize: 13 }} />
              <select value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })} style={{ padding: '8px 12px', border: '1px solid var(--hairline)', fontSize: 13, background: '#fff' }}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
              <input type="text" placeholder="Contact Number" required value={newPatient.contact_number} onChange={e => setNewPatient({ ...newPatient, contact_number: e.target.value })} style={{ padding: '8px 12px', border: '1px solid var(--hairline)', fontSize: 13 }} />
              <input type="text" placeholder="Address" required value={newPatient.address} onChange={e => setNewPatient({ ...newPatient, address: e.target.value })} style={{ padding: '8px 12px', border: '1px solid var(--hairline)', fontSize: 13 }} />
            </div>
            <input type="text" placeholder="Medical Condition" value={newPatient.medical_history} onChange={e => setNewPatient({ ...newPatient, medical_history: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--hairline)', fontSize: 13, marginBottom: 12 }} />
            <button type="submit" className="clinical-btn"><Plus size={14} /> ENROLL PATIENT</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {patients.map(p => (
              <div key={p.id} style={{ background: '#fff', border: '1px solid var(--hairline)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{p.name}</span> · <span style={{ color: 'var(--rust)', fontSize: 12 }}>{p.age} yrs · {p.gender}</span>
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>{p.medical_history || 'No conditions listed'}</p>
                  <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>{p.contact_number} · {p.address}</p>
                </div>
                <button onClick={() => handleDeletePatient(p.id)} style={{ background: 'none', border: 'none', color: 'var(--rust)', cursor: 'pointer', padding: 6 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Doctor CRUD */}
      {activeAdminSubTab === 'doctors' && (
        <div>
          <form onSubmit={handleAddDoctor} style={{ background: '#fff', border: '1px solid var(--hairline)', padding: 18, marginBottom: 24 }}>
            <span className="label-caps" style={{ color: 'var(--rust)', display: 'block', marginBottom: 12 }}>Register New Doctor</span>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr', gap: 12, marginBottom: 12 }}>
              <input type="text" placeholder="Dr. Full Name" required value={newDoctor.name} onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })} style={{ padding: '8px 12px', border: '1px solid var(--hairline)', fontSize: 13 }} />
              <input type="text" placeholder="Specialization (e.g. Cardiology)" required value={newDoctor.specialization} onChange={e => setNewDoctor({ ...newDoctor, specialization: e.target.value })} style={{ padding: '8px 12px', border: '1px solid var(--hairline)', fontSize: 13 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input type="email" placeholder="Email" required value={newDoctor.email} onChange={e => setNewDoctor({ ...newDoctor, email: e.target.value })} style={{ padding: '8px 12px', border: '1px solid var(--hairline)', fontSize: 13 }} />
              <input type="text" placeholder="Phone" required value={newDoctor.contact_number} onChange={e => setNewDoctor({ ...newDoctor, contact_number: e.target.value })} style={{ padding: '8px 12px', border: '1px solid var(--hairline)', fontSize: 13 }} />
              <input type="number" placeholder="Years Exp" value={newDoctor.years_of_experience} onChange={e => setNewDoctor({ ...newDoctor, years_of_experience: e.target.value })} style={{ padding: '8px 12px', border: '1px solid var(--hairline)', fontSize: 13 }} />
            </div>
            <button type="submit" className="clinical-btn"><Plus size={14} /> REGISTER DOCTOR</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {doctors.map(d => (
              <div key={d.id} style={{ background: '#fff', border: '1px solid var(--hairline)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{d.name}</span> · <span style={{ background: 'var(--rust-light)', color: 'var(--rust)', padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{d.specialization}</span>
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>{d.years_of_experience} years experience · {d.email}</p>
                </div>
                <button onClick={() => handleDeleteDoctor(d.id)} style={{ background: 'none', border: 'none', color: 'var(--rust)', cursor: 'pointer', padding: 6 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Mapping CRUD */}
      {activeAdminSubTab === 'mappings' && (
        <div>
          <form onSubmit={handleAddMapping} style={{ background: '#fff', border: '1px solid var(--hairline)', padding: 18, marginBottom: 24 }}>
            <span className="label-caps" style={{ color: 'var(--rust)', display: 'block', marginBottom: 12 }}>Assign Doctor to Patient</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <select value={newMapping.patient_id} onChange={e => setNewMapping({ ...newMapping, patient_id: e.target.value })} style={{ padding: '8px 12px', border: '1px solid var(--hairline)', fontSize: 13, background: '#fff' }}>
                <option value="">-- Choose Patient --</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={newMapping.doctor_id} onChange={e => setNewMapping({ ...newMapping, doctor_id: e.target.value })} style={{ padding: '8px 12px', border: '1px solid var(--hairline)', fontSize: 13, background: '#fff' }}>
                <option value="">-- Choose Doctor --</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>)}
              </select>
            </div>
            <input type="text" placeholder="Clinical notes" value={newMapping.notes} onChange={e => setNewMapping({ ...newMapping, notes: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--hairline)', fontSize: 13, marginBottom: 12 }} />
            <button type="submit" className="clinical-btn"><Plus size={14} /> ASSIGN DOCTOR</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mappings.map(m => (
              <div key={m.id} style={{ background: '#fff', border: '1px solid var(--hairline)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{m.patient?.name || m.patient_name}</span> ➔ <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Dr. {m.doctor?.name || m.doctor_name}</span>
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>{m.notes || 'Routine referral'}</p>
                </div>
                <button onClick={() => handleDeleteMapping(m.id)} style={{ background: 'none', border: 'none', color: 'var(--rust)', cursor: 'pointer', padding: 6 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const isAdminRoute = currentPath === '/admin' || currentPath.startsWith('/admin');

  // Dedicated Route: /admin (Displays Admin Login first, then Executive Cockpit once authenticated)
  if (isAdminRoute) {
    if (!adminSessionAuthenticated) {
      return (
        <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
          {/* Toast Notification */}
          {notification && (
            <div style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 100000,
              background: 'var(--ink)',
              color: 'var(--paper)',
              padding: '14px 24px',
              borderLeft: '4px solid var(--rust)',
              boxShadow: '0 12px 35px rgba(0,0,0,0.22)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 13,
              fontWeight: 500
            }}>
              <Activity size={16} color="var(--rust)" />
              {notification}
            </div>
          )}

          {/* Minimalist Top Bar */}
          <header style={{
            padding: '18px 48px',
            borderBottom: '1px solid var(--hairline)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--paper-dark)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ShieldAlert size={20} color="var(--rust)" />
              <span className="font-display" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', letterSpacing: '0.04em' }}>
                VERITAS CLINICAL SYSTEMS
              </span>
              <span className="label-caps" style={{ fontSize: 9, background: 'var(--rust)', color: '#fff', padding: '2px 8px', borderRadius: 4 }}>
                RESTRICTED ADMIN ACCESS
              </span>
            </div>

            <button
              onClick={() => navigateTo('/')}
              className="clinical-btn-outline"
              style={{ padding: '6px 14px', fontSize: 11 }}
            >
              ← RETURN TO PATIENT & DOCTOR PORTAL
            </button>
          </header>

          {/* Center Card */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px'
          }}>
            <div style={{
              width: '100%',
              maxWidth: 480,
              background: '#fff',
              border: '1px solid var(--hairline)',
              padding: '36px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.08)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--rust-light)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}>
                  <ShieldAlert size={24} color="var(--rust)" />
                </div>
                <span className="label-caps" style={{ color: 'var(--rust)', fontSize: 10, display: 'block', letterSpacing: '0.24em' }}>
                  HOSPITAL COMMAND GATEWAY
                </span>
                <h2 className="font-display" style={{ fontSize: 26, marginTop: 4, color: 'var(--ink)' }}>
                  Admin Portal Login
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 8, lineHeight: 1.5 }}>
                  Access to hospital surveillance, patient roster, faculty credentials, and clinical care directives.
                </p>
              </div>

              {adminError && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '10px 14px',
                  fontSize: 12,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <AlertCircle size={16} />
                  {adminError}
                </div>
              )}

              {/* Quick Demo 1-Click Login Button */}
              <div style={{ background: 'var(--paper)', border: '1px solid var(--hairline)', padding: 14, marginBottom: 20 }}>
                <span className="label-caps" style={{ fontSize: 9, color: 'var(--ink-muted)', display: 'block', marginBottom: 8 }}>
                  INSTANT 1-CLICK VERIFICATION:
                </span>
                <button
                  type="button"
                  onClick={handleAdminQuickLogin}
                  className="clinical-btn"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 11, padding: '10px 14px' }}
                >
                  👑 QUICK 1-CLICK CHIEF ADMIN LOGIN
                </button>
              </div>

              <form onSubmit={handleAdminLogin}>
                <div style={{ marginBottom: 14 }}>
                  <label className="label-caps" style={{ fontSize: 9.5, display: 'block', marginBottom: 4 }}>Administrator Email</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@hospital.com"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--hairline)', fontSize: 13 }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="label-caps" style={{ fontSize: 9.5, display: 'block', marginBottom: 4 }}>Administrator Password</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--hairline)', fontSize: 13 }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="clinical-btn"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 12 }}
                >
                  {loading ? 'VERIFYING CREDENTIALS...' : 'AUTHENTICATE & ENTER COMMAND →'}
                </button>
              </form>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--hairline)', textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                  Not an administrator? <button onClick={() => navigateTo('/')} style={{ background: 'none', border: 'none', color: 'var(--rust)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>Go to Patient & Doctor Portals</button>
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Authenticated Admin Dashboard View
    return (
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
        {/* Toast Notification */}
        {notification && (
          <div style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 100000,
            background: 'var(--ink)',
            color: 'var(--paper)',
            padding: '14px 24px',
            borderLeft: '4px solid var(--rust)',
            boxShadow: '0 12px 35px rgba(0,0,0,0.22)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 13,
            fontWeight: 500
          }}>
            <Activity size={16} color="var(--rust)" />
            {notification}
          </div>
        )}

        {/* Admin Executive Top Bar */}
        <header style={{
          padding: '16px 48px',
          borderBottom: '1px solid var(--hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--paper-dark)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="label-caps" style={{ color: '#fff', background: 'var(--rust)', padding: '2px 8px', borderRadius: 4, fontSize: 9 }}>
                EXECUTIVE COMMAND
              </span>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink)' }}>
                {backendOnline ? 'POSTGRESQL · REAL-TIME' : 'BACKEND CONNECTING...'}
              </span>
            </div>
            <h1 className="font-display" style={{ fontSize: 22, marginTop: 4, color: 'var(--ink)' }}>
              Hospital Surveillance & Monitoring Cockpit
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              Logged in: <strong style={{ color: 'var(--ink)' }}>{currentUser?.name || 'Chief Admin'}</strong> (ADMIN)
            </span>
            <button
              onClick={fetchData}
              className="clinical-btn-outline"
              style={{ padding: '6px 12px', fontSize: 11 }}
            >
              <RefreshCw size={13} className={loading ? 'spin-slow' : ''} /> REFRESH
            </button>
            <button
              onClick={() => navigateTo('/')}
              className="clinical-btn-outline"
              style={{ padding: '6px 12px', fontSize: 11 }}
            >
              VIEW PUBLIC SITE
            </button>
            <button
              onClick={handleAdminLogout}
              className="clinical-btn"
              style={{ padding: '6px 14px', fontSize: 11, background: 'var(--rust)' }}
            >
              <LogOut size={13} /> SIGN OUT
            </button>
          </div>
        </header>

        {/* Admin Dashboard Body */}
        <main style={{ maxWidth: 1280, width: '100%', margin: '0 auto', padding: '36px 48px', flex: 1 }}>
          {renderAdminDashboardContent()}
        </main>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--paper)' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 100000,
          background: 'var(--ink)',
          color: 'var(--paper)',
          padding: '14px 24px',
          borderLeft: '4px solid var(--rust)',
          boxShadow: '0 12px 35px rgba(0,0,0,0.22)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.04em'
        }}>
          <Activity size={16} color="var(--rust)" />
          {notification}
        </div>
      )}

      {/* =========================================================================
          ROLE SWITCHER BAR (Instant role toggling for pair testing)
          ========================================================================= */}
      <div style={{
        background: 'var(--paper-dark)',
        borderBottom: '1px solid var(--hairline)',
        padding: '10px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="label-caps" style={{ color: 'var(--ink)', fontSize: 10 }}>SELECT WORKSPACE PERSPECTIVE:</span>
          
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.7)', borderRadius: 20, padding: 3, border: '1px solid var(--hairline)' }}>
            <button
              onClick={() => handleRoleSwitch('doctor')}
              style={{
                padding: '5px 14px',
                borderRadius: 16,
                border: 'none',
                background: activeRole === 'doctor' ? 'var(--rust)' : 'transparent',
                color: activeRole === 'doctor' ? '#fff' : 'var(--ink)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              🩺 Doctor Bucket ({doctorBucket.length})
            </button>

            <button
              onClick={() => handleRoleSwitch('patient')}
              style={{
                padding: '5px 14px',
                borderRadius: 16,
                border: 'none',
                background: activeRole === 'patient' ? 'var(--teal)' : 'transparent',
                color: activeRole === 'patient' ? '#fff' : 'var(--ink)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              👤 Patient Portal
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
            Logged in as: <strong>{currentUser?.name || 'Guest'}</strong> ({activeRole.toUpperCase()})
          </span>
          <button 
            onClick={() => setAuthModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 11,
              color: 'var(--rust)',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline'
            }}
          >
            Switch User Account
          </button>

          <button
            onClick={() => navigateTo('/admin')}
            style={{
              background: 'var(--ink)',
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 16,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
            title="Hospital Command & Monitoring (Requires Admin Authentication)"
          >
            <ShieldAlert size={12} color="var(--rust)" />
            Admin Portal (/admin)
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1 · HERO (Full Viewport Stage)
          ========================================================================= */}
      <section style={{
        position: 'relative',
        height: 'calc(100vh - 46px)',
        minHeight: 650,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '28px 48px',
        borderBottom: '1px solid var(--hairline)'
      }}>
        {/* Parallax Background Photo with Clinical Blur & Melt */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '110%',
          transform: `translateY(${scrollY * 0.32}px)`,
          filter: `blur(${Math.min(6, scrollY * 0.015)}px)`,
          backgroundImage: 'radial-gradient(ellipse at 50% 40%, rgba(246, 243, 236, 0.25) 0%, rgba(27, 36, 42, 0.45) 100%), url(https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=2000&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1,
          transition: 'transform 0.1s ease-out'
        }} />

        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: `${Math.min(100, 34 + scrollY * 0.15)}%`,
          background: 'linear-gradient(to bottom, rgba(246,243,236,0) 0%, rgba(246,243,236,0.85) 60%, rgba(246,243,236,1) 100%)',
          zIndex: 3,
          pointerEvents: 'none'
        }} />

        {/* Top Editorial Nav */}
        <header style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--hairline)',
          paddingBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div 
              onClick={() => setConsoleOpen(!consoleOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ width: 18, height: 1.5, background: 'var(--ink)' }}></span>
                <span style={{ width: 14, height: 1.5, background: 'var(--ink)' }}></span>
              </div>
              <span className="label-caps" style={{ color: 'var(--ink)' }}>
                {activeRole === 'doctor' ? 'DOCTOR BUCKET' : 'PATIENT PORTAL'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.7)',
              padding: '4px 10px',
              borderRadius: 20,
              border: '1px solid var(--hairline)'
            }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: backendOnline ? '#16a34a' : '#d97706',
                boxShadow: backendOnline ? '0 0 8px #16a34a' : 'none'
              }} />
              <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink)' }}>
                {backendOnline ? 'POSTGRESQL · REAL-TIME' : 'BACKEND CONNECTING...'}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1 className="font-display" style={{
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: '0.04em',
              color: 'var(--ink)',
              textTransform: 'uppercase'
            }}>
              Veritas Clinical
            </h1>
            <p className="label-caps" style={{ fontSize: 7.5, letterSpacing: '0.34em', color: 'var(--rust)', marginTop: 2 }}>
              ROLE-TAILORED SURGICAL PLATFORM · ISO-13485
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button 
              onClick={() => setConsoleOpen(true)}
              className="clinical-btn"
            >
              ENTER {activeRole.toUpperCase()} UI <ArrowUpRight size={14} />
            </button>
          </div>
        </header>

        {/* Center Stage Title Block */}
        <div style={{
          position: 'relative',
          zIndex: 4,
          textAlign: 'center',
          margin: 'auto 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <p className="label-caps" style={{
            color: 'var(--rust)',
            fontSize: 'clamp(11px, 0.9vw, 14px)',
            marginBottom: 16,
            letterSpacing: '0.3em'
          }}>
            {activeRole === 'doctor'
              ? 'PHYSICIAN WORKSPACE · INTAKE QUEUE & CLINICAL BUCKET'
              : 'PATIENT DIRECTORY · CHOOSE & ASSIGN YOUR DOCTOR'}
          </p>

          <h2 className="font-display" style={{
            fontSize: 'clamp(52px, 10.5vw, 154px)',
            fontWeight: 500,
            lineHeight: 0.85,
            letterSpacing: '0.01em',
            color: 'var(--ink)',
            textTransform: 'uppercase',
            margin: '0 auto',
            userSelect: 'none'
          }}>
            {renderClimbingLetters(activeRole === 'doctor' ? "IN-BASKET" : "DISCOVERY", 200)}
          </h2>

          <p style={{
            maxWidth: 680,
            marginTop: 28,
            fontSize: 14.5,
            lineHeight: 1.6,
            color: 'var(--ink-muted)',
            fontWeight: 400
          }}>
            {activeRole === 'doctor'
              ? 'Monitor your assigned patient bucket in real time, view diagnostic indications, and review referral directives.'
              : 'Explore certified medical specialists, compare clinical experience, and pick your primary attending physician.'}
          </p>
        </div>

        {/* Center Pill */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => setConsoleOpen(true)}
            style={{
              background: 'var(--paper-card)',
              border: '1px solid var(--hairline)',
              borderRadius: 30,
              padding: '12px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(27,36,42,0.08)',
              transition: 'transform 0.25s ease, border-color 0.25s ease'
            }}
          >
            <span style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--rust-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Stethoscope size={13} color="var(--rust)" />
            </span>
            <span className="label-caps" style={{ color: 'var(--ink)' }}>
              OPEN {activeRole.toUpperCase()} DASHBOARD
            </span>
            <ChevronRight size={14} color="var(--ink-muted)" />
          </button>
        </div>
      </section>

      {/* =========================================================================
          SLIDE-OVER / FULLSCREEN ROLE-BASED WORKSPACE PANEL
          ========================================================================= */}
      {consoleOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(27, 36, 42, 0.65)',
          backdropFilter: 'blur(6px)'
        }}>
          <div onClick={() => setConsoleOpen(false)} style={{ flex: 1 }} />

          <div style={{
            width: '100%',
            maxWidth: 1020,
            height: '100%',
            background: 'var(--paper)',
            boxShadow: '-10px 0 45px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 36px',
              borderBottom: '1px solid var(--hairline)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--paper-dark)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="label-caps" style={{ 
                    color: activeRole === 'doctor' ? 'var(--teal)' : 'var(--ink)',
                    background: 'rgba(255,255,255,0.7)',
                    padding: '3px 8px',
                    borderRadius: 4
                  }}>
                    {activeRole.toUpperCase()} PORTAL
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                    Session: {currentUser?.name || 'Guest'}
                  </span>
                </div>
                <h3 className="font-display" style={{ fontSize: 24, marginTop: 4 }}>
                  {activeRole === 'doctor'
                    ? `Dr. ${currentDoctorRecord?.name || 'Staff Physician'} · Patient Bucket`
                    : `${currentPatientRecord?.name || 'Patient'} · Doctor Selection Portal`}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={fetchData}
                  className="clinical-btn-outline"
                  style={{ padding: '6px 12px', fontSize: 11 }}
                  title="Reload PostgreSQL Data"
                >
                  <RefreshCw size={13} className={loading ? 'spin-slow' : ''} /> REFRESH
                </button>
                <button 
                  onClick={() => setConsoleOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--ink)' }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Main Role Content */}
            <div style={{ padding: '36px', flex: 1 }}>

              {/* =========================================================================
                  UI 2 · DOCTOR WORKSPACE (Monitor patients coming in their buckets)
                  ========================================================================= */}
              {activeRole === 'doctor' && (
                <div>
                  <div style={{
                    background: '#fff',
                    border: '1px solid var(--hairline)',
                    padding: 24,
                    marginBottom: 28,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span className="label-caps" style={{ color: 'var(--rust)' }}>PHYSICIAN COCKPIT</span>
                      <h4 className="font-display" style={{ fontSize: 22, marginTop: 4 }}>
                        Dr. {currentDoctorRecord?.name || currentUser?.name || 'Attending Physician'}
                      </h4>
                      <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>
                        Specialty: <strong>{currentDoctorRecord?.specialization || 'Clinical Specialist'}</strong> · {currentDoctorRecord?.years_of_experience || 0} Years Clinical Practice
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="label-caps" style={{ fontSize: 10, color: 'var(--ink-muted)' }}>PATIENTS IN BUCKET</span>
                      <p className="font-display" style={{ fontSize: 32, fontWeight: 700, color: 'var(--rust)' }}>
                        {doctorBucket.length}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h5 className="font-display" style={{ fontSize: 18 }}>Active Patient In-Basket (Incoming Queue)</h5>
                      <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                        Real-time stream of patients routed and assigned to your care.
                      </p>
                    </div>
                    <span className="label-caps" style={{ color: 'var(--teal)' }}>
                      ● SURVEILLANCE ACTIVE
                    </span>
                  </div>

                  {doctorBucket.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', border: '1px solid var(--hairline)' }}>
                      <FolderHeart size={36} color="var(--ink-muted)" style={{ margin: '0 auto 12px' }} />
                      <p style={{ fontWeight: 600 }}>Your Patient Bucket is Currently Empty</p>
                      <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
                        When patients pick you from their portal or admin assigns you, they appear in this bucket in real time.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {doctorBucket.map(m => {
                        const pat = m.patient || {};
                        return (
                          <div 
                            key={m.id}
                            style={{
                              background: '#fff',
                              border: '1px solid var(--hairline)',
                              borderLeft: '4px solid var(--rust)',
                              padding: '20px 24px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'start'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
                                  {pat.name || m.patient_name || 'Patient'}
                                </span>
                                <span style={{ fontSize: 11, background: 'var(--paper-dark)', padding: '2px 8px', fontWeight: 600 }}>
                                  {pat.age || 48} yrs · {pat.gender || 'Female'}
                                </span>
                                <span style={{
                                  fontSize: 10,
                                  background: '#dcfce7',
                                  color: '#166534',
                                  padding: '2px 8px',
                                  fontWeight: 600,
                                  borderRadius: 10
                                }}>
                                  TRIAGE: ACTIVE
                                </span>
                              </div>

                              <div style={{ marginTop: 8, fontSize: 13 }}>
                                <strong style={{ color: 'var(--ink)' }}>Indication / History: </strong>
                                <span style={{ color: 'var(--rust)', fontWeight: 500 }}>
                                  {pat.medical_history || 'Under active clinical evaluation'}
                                </span>
                              </div>

                              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-muted)' }}>
                                <strong>Clinical Directive: </strong>{m.notes || 'Routine physician surveillance'}
                              </div>

                              <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>
                                Tel: {pat.contact_number || '+1 (555) 349-8812'} · Address: {pat.address || 'Medical Ward 3'}
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>
                                In Bucket: {new Date(m.assigned_at).toLocaleDateString()}
                              </span>
                              <button
                                onClick={() => handleDeleteMapping(m.id)}
                                className="clinical-btn-outline"
                                style={{ padding: '6px 12px', fontSize: 10, color: 'var(--rust)', borderColor: 'var(--rust-light)' }}
                                title="Discharge patient from bucket"
                              >
                                DISCHARGE FROM BUCKET
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================================
                  UI 3 · PATIENT PORTAL (See which doctors can they pick)
                  ========================================================================= */}
              {activeRole === 'patient' && (
                <div>
                  {/* Patient Banner */}
                  <div style={{
                    background: '#fff',
                    border: '1px solid var(--hairline)',
                    padding: 24,
                    marginBottom: 24,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span className="label-caps" style={{ color: 'var(--teal)' }}>PATIENT EHR PORTAL</span>
                      <h4 className="font-display" style={{ fontSize: 22, marginTop: 4 }}>
                        {currentPatientRecord?.name || currentUser?.name || 'Registered Patient'}
                      </h4>
                      <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>
                        {currentPatientRecord?.age ? `${currentPatientRecord.age} yrs` : 'Enrolled'} · {currentPatientRecord?.gender || 'Patient'} · {currentPatientRecord?.medical_history || 'Routine Outpatient Care'}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="label-caps" style={{ fontSize: 10, color: 'var(--ink-muted)' }}>YOUR ASSIGNED DOCTORS</span>
                      <p className="font-display" style={{ fontSize: 32, fontWeight: 700, color: 'var(--teal)' }}>
                        {patientAssignedDoctors.length}
                      </p>
                    </div>
                  </div>

                  {/* Immediate prompt for newly registered patients */}
                  {patientAssignedDoctors.length === 0 && (
                    <div style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      padding: '16px 20px',
                      marginBottom: 24,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14
                    }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Sparkles size={18} color="#16a34a" />
                      </div>
                      <div>
                        <strong style={{ color: '#15803d', fontSize: 14 }}>
                          Welcome, {currentUser?.name || 'Patient'}! Your account is active.
                        </strong>
                        <p style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>
                          You have not selected a doctor yet. Please browse the verified medical specialists below and click <strong>"PICK THIS DOCTOR"</strong> to assign your attending physician.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Section A: My Assigned Doctors */}
                  <div style={{ marginBottom: 32 }}>
                    <h5 className="font-display" style={{ fontSize: 18, marginBottom: 12 }}>
                      My Attending Medical Team
                    </h5>
                    {patientAssignedDoctors.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--ink-muted)', background: '#fff', padding: 18, border: '1px solid var(--hairline)' }}>
                        No doctors currently assigned to your profile. Select from the faculty roster below!
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
                        {patientAssignedDoctors.map(m => (
                          <div key={m.id} style={{
                            background: '#fff',
                            border: '1px solid var(--hairline)',
                            borderTop: '3px solid var(--teal)',
                            padding: '16px 20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 700, fontSize: 15 }}>Dr. {m.doctor?.name || m.doctor_name}</span>
                                <span style={{ fontSize: 10, background: 'var(--rust-light)', color: 'var(--rust)', padding: '2px 6px', fontWeight: 600 }}>
                                  {m.doctor?.specialization || m.doctor_spec}
                                </span>
                              </div>
                              <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
                                Notes: {m.notes || 'Primary physician assignment'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteMapping(m.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--rust)', cursor: 'pointer', padding: 6 }}
                              title="Remove doctor"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section B: Which Doctors Can They Pick */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div>
                        <h5 className="font-display" style={{ fontSize: 18 }}>
                          Pick a Certified Doctor
                        </h5>
                        <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                          Browse faculty specialists and assign your physician with 1 click.
                        </p>
                      </div>

                      {/* Filter by specialty */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="label-caps" style={{ fontSize: 10 }}>Filter:</span>
                        <select 
                          value={doctorSpecialtyFilter}
                          onChange={e => setDoctorSpecialtyFilter(e.target.value)}
                          style={{ padding: '6px 12px', border: '1px solid var(--hairline)', background: '#fff', fontSize: 12 }}
                        >
                          <option value="All">All Specialties</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Neurosurgery">Neurosurgery</option>
                          <option value="Oncology">Oncology</option>
                          <option value="Surgery">Surgery</option>
                        </select>
                      </div>
                    </div>

                    {/* Doctors Catalog Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                      {filteredDoctors.map(doc => {
                        const isAlreadyAssigned = patientAssignedDoctors.some(m => m.doctor?.id === doc.id || m.doctor_id === doc.id);
                        return (
                          <div 
                            key={doc.id}
                            style={{
                              background: '#fff',
                              border: isAlreadyAssigned ? '2px solid var(--teal)' : '1px solid var(--hairline)',
                              padding: 20,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                  <span className="label-caps" style={{ fontSize: 9, color: 'var(--rust)' }}>FACULTY PHYSICIAN</span>
                                  <h6 className="font-display" style={{ fontSize: 18, marginTop: 2 }}>{doc.name}</h6>
                                </div>
                                <span style={{
                                  fontSize: 10,
                                  background: 'var(--rust-light)',
                                  color: 'var(--rust)',
                                  padding: '3px 8px',
                                  fontWeight: 600
                                }}>
                                  {doc.specialization}
                                </span>
                              </div>

                              <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 10 }}>
                                <strong>Experience:</strong> {doc.years_of_experience} Years Clinical Practice
                              </p>
                              <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
                                <strong>Email:</strong> {doc.email}
                              </p>
                            </div>

                            <div style={{ marginTop: 20 }}>
                              {isAlreadyAssigned ? (
                                <button 
                                  disabled
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: '#ecfdf5',
                                    color: '#047857',
                                    border: '1px solid #a7f3d0',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    letterSpacing: '0.08em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    cursor: 'default'
                                  }}
                                >
                                  <CheckCircle2 size={14} /> CURRENTLY ASSIGNED
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handlePatientPickDoctor(doc.id, doc.name)}
                                  className="clinical-btn"
                                  style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}
                                >
                                  <Plus size={14} /> PICK THIS DOCTOR
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          AUTHENTICATION MODAL (Choose or Log in into any role)
          ========================================================================= */}
      {authModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 100001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(27, 36, 42, 0.65)',
          backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            width: '100%',
            maxWidth: 480,
            background: 'var(--paper)',
            padding: 32,
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid var(--hairline)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <span className="label-caps" style={{ color: 'var(--rust)' }}>ACCESS CONTROL GATEWAY</span>
                <h3 className="font-display" style={{ fontSize: 22, marginTop: 4 }}>
                  {authMode === 'login' ? 'Role-Based Login' : 'Register New User'}
                </h3>
              </div>
              <button onClick={() => setAuthModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Quick 1-Click Role Logins */}
            {authMode === 'login' && (
              <div style={{ background: '#fff', border: '1px solid var(--hairline)', padding: 16, marginBottom: 20 }}>
                <span className="label-caps" style={{ fontSize: 9.5, color: 'var(--ink-muted)', display: 'block', marginBottom: 10 }}>
                  INSTANT 1-CLICK ROLE LOGIN:
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('dr.sarah@hospital.com', 'DoctorPass123!', 'doctor')}
                    className="clinical-btn"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 14px', fontSize: 11, background: 'var(--rust)' }}
                  >
                    🩺 LOG IN AS DOCTOR (Dr. Sarah Jenkins)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('patient.eleanor@hospital.com', 'PatientPass123!', 'patient')}
                    className="clinical-btn"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 14px', fontSize: 11, background: 'var(--teal)' }}
                  >
                    👤 LOG IN AS PATIENT (Eleanor Vance)
                  </button>
                </div>

                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center' }}>
                  Hospital Administrators: Access the <button type="button" onClick={() => { setAuthModalOpen(false); navigateTo('/admin'); }} style={{ background: 'none', border: 'none', color: 'var(--rust)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>/admin portal</button>
                </div>
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label className="label-caps" style={{ fontSize: 9.5, display: 'block', marginBottom: 4 }}>Full Name</label>
                    <input type="text" required value={authName} onChange={e => setAuthName(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--hairline)', fontSize: 13 }} />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label className="label-caps" style={{ fontSize: 9.5, display: 'block', marginBottom: 4 }}>Account Role</label>
                    <select value={authRole} onChange={e => setAuthRole(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--hairline)', fontSize: 13, background: '#fff' }}>
                      <option value="patient">Patient (Can Pick Doctors)</option>
                      <option value="doctor">Doctor (Can Monitor Bucket)</option>
                    </select>
                  </div>

                  {authRole === 'patient' && (
                    <div style={{ background: '#f8fafc', border: '1px solid var(--hairline)', padding: 14, marginBottom: 12 }}>
                      <span className="label-caps" style={{ fontSize: 9.5, color: 'var(--teal)', display: 'block', marginBottom: 10 }}>
                        BASIC PATIENT INFORMATION (REQUIRED):
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <label className="label-caps" style={{ fontSize: 9, display: 'block', marginBottom: 4 }}>Age *</label>
                          <input type="number" min="1" max="130" placeholder="e.g. 29" required value={patientRegAge} onChange={e => setPatientRegAge(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--hairline)', fontSize: 13 }} />
                        </div>
                        <div>
                          <label className="label-caps" style={{ fontSize: 9, display: 'block', marginBottom: 4 }}>Gender *</label>
                          <select required value={patientRegGender} onChange={e => setPatientRegGender(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--hairline)', fontSize: 13, background: '#fff' }}>
                            <option value="">-- Select Gender --</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="label-caps" style={{ fontSize: 9, display: 'block', marginBottom: 4 }}>Contact Phone *</label>
                        <input type="tel" placeholder="e.g. 9876543210" required value={patientRegPhone} onChange={e => setPatientRegPhone(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--hairline)', fontSize: 13 }} />
                      </div>
                      <div>
                        <label className="label-caps" style={{ fontSize: 9, display: 'block', marginBottom: 4 }}>Primary Condition / Reason for Visit *</label>
                        <input type="text" placeholder="e.g. Cardiology checkup, Arrhythmia, General Consultation" required value={patientRegHistory} onChange={e => setPatientRegHistory(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--hairline)', fontSize: 13 }} />
                      </div>
                    </div>
                  )}

                  {authRole === 'doctor' && (
                    <div style={{ background: '#fdf2f8', border: '1px solid var(--hairline)', padding: 14, marginBottom: 12 }}>
                      <span className="label-caps" style={{ fontSize: 9.5, color: 'var(--rust)', display: 'block', marginBottom: 10 }}>
                        PHYSICIAN CREDENTIALS & ONBOARDING (REQUIRED):
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <label className="label-caps" style={{ fontSize: 9, display: 'block', marginBottom: 4 }}>Medical Specialization *</label>
                          <select required value={doctorRegSpec} onChange={e => setDoctorRegSpec(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--hairline)', fontSize: 13, background: '#fff' }}>
                            <option value="">-- Select Specialization --</option>
                            <option value="Interventional Cardiology">Interventional Cardiology</option>
                            <option value="Cerebrovascular Neurosurgery">Cerebrovascular Neurosurgery</option>
                            <option value="Precision Oncology">Precision Oncology</option>
                            <option value="General & Thoracic Surgery">General & Thoracic Surgery</option>
                            <option value="Pediatrics & Neonatal Care">Pediatrics & Neonatal Care</option>
                            <option value="Diagnostic Medicine">Diagnostic Medicine</option>
                          </select>
                        </div>
                        <div>
                          <label className="label-caps" style={{ fontSize: 9, display: 'block', marginBottom: 4 }}>Exp (Years) *</label>
                          <input type="number" min="0" max="65" placeholder="e.g. 12" required value={doctorRegExp} onChange={e => setDoctorRegExp(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--hairline)', fontSize: 13 }} />
                        </div>
                      </div>
                      <div>
                        <label className="label-caps" style={{ fontSize: 9, display: 'block', marginBottom: 4 }}>Faculty Direct Line / Phone *</label>
                        <input type="tel" placeholder="e.g. +1-555-0844" required value={doctorRegPhone} onChange={e => setDoctorRegPhone(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--hairline)', fontSize: 13 }} />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div style={{ marginBottom: 12 }}>
                <label className="label-caps" style={{ fontSize: 9.5, display: 'block', marginBottom: 4 }}>Email Address</label>
                <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--hairline)', fontSize: 13 }} />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label className="label-caps" style={{ fontSize: 9.5, display: 'block', marginBottom: 4 }}>Password</label>
                <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--hairline)', fontSize: 13 }} />
              </div>

              <button type="submit" disabled={loading} className="clinical-btn" style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'AUTHENTICATING...' : authMode === 'login' ? 'LOGIN WITH CREDENTIALS' : 'CREATE ACCOUNT'}
              </button>

              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--rust)', textDecoration: 'underline' }}
                >
                  {authMode === 'login' ? "Don't have an account? Register new user" : "Already have an account? Log in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: '48px 32px',
        borderTop: '1px solid var(--hairline)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
        color: 'var(--ink-muted)'
      }}>
        <div>
          <span className="font-display" style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>
            VERITAS CLINICAL SYSTEMS
          </span>
          <p style={{ marginTop: 4 }}>Role-Segregated EHR Architecture (Admin · Doctor · Patient)</p>
        </div>
        <div className="label-caps" style={{ color: 'var(--rust)' }}>
          POSTGRESQL ORM & DJANGO REST FRAMEWORK
        </div>
      </footer>

    </div>
  );
}
