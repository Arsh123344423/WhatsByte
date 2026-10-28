const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

/**
 * Helper to get the stored JWT access token from localStorage
 */
export const getToken = () => localStorage.getItem('access_token');
export const setToken = (token) => localStorage.setItem('access_token', token);
export const removeToken = () => localStorage.removeItem('access_token');

export const getUser = () => {
  const user = localStorage.getItem('user_info');
  return user ? JSON.parse(user) : null;
};
export const setUser = (user) => localStorage.setItem('user_info', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('user_info');

/**
 * Generalized fetch request with automatic JWT authorization header
 */
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      let errorMessage = data.message || data.detail;
      if (data.errors) {
        if (typeof data.errors === 'string') {
          errorMessage = data.errors;
        } else if (typeof data.errors === 'object') {
          const details = Object.entries(data.errors)
            .map(([field, err]) => `${field}: ${Array.isArray(err) ? err.join(', ') : err}`)
            .join(' | ');
          errorMessage = `${errorMessage ? errorMessage + ' (' : ''}${details}${errorMessage ? ')' : ''}`;
        }
      }
      throw new Error(errorMessage || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Call failed on ${url}:`, err);
    throw err;
  }
}

// 1. Authentication Endpoints
export const authAPI = {
  login: async (email, password) => {
    const data = await request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const token = data.tokens?.access || data.token;
    if (token) setToken(token);
    if (data.user) setUser(data.user);
    return data;
  },

  register: async (name, email, password) => {
    const data = await request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    const token = data.tokens?.access || data.token;
    if (token) setToken(token);
    if (data.user) setUser(data.user);
    return data;
  },

  logout: () => {
    removeToken();
    removeUser();
  }
};

// 2. Patient Management Endpoints
export const patientAPI = {
  list: () => request('/patients/'),
  listAll: () => request('/patients/?all=true'),
  get: (id) => request(`/patients/${id}/`),
  create: (patientData) => request('/patients/', {
    method: 'POST',
    body: JSON.stringify(patientData),
  }),
  update: (id, patientData) => request(`/patients/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(patientData),
  }),
  delete: (id) => request(`/patients/${id}/`, {
    method: 'DELETE',
  }),
};

// 3. Doctor Management Endpoints
export const doctorAPI = {
  list: () => request('/doctors/'),
  get: (id) => request(`/doctors/${id}/`),
  create: (doctorData) => request('/doctors/', {
    method: 'POST',
    body: JSON.stringify(doctorData),
  }),
  update: (id, doctorData) => request(`/doctors/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(doctorData),
  }),
  delete: (id) => request(`/doctors/${id}/`, {
    method: 'DELETE',
  }),
};

// 4. Patient-Doctor Mapping Endpoints
export const mappingAPI = {
  list: () => request('/mappings/'),
  getDoctorBucket: (doctorId) => request(`/mappings/?doctor_id=${doctorId}`),
  getPatientDoctors: (patientId) => request(`/mappings/${patientId}/`),
  assign: (mappingData) => request('/mappings/', {
    method: 'POST',
    body: JSON.stringify(mappingData),
  }),
  remove: (id) => request(`/mappings/${id}/`, {
    method: 'DELETE',
  }),
};
