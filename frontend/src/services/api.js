// API Client for Cloud-Based Smart Agriculture System
const API_BASE = '/api';

/**
 * Helper to execute JSON fetch requests with error handling
 */
async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error || data.message || `HTTP ${res.status}: Request failed`;
      throw new Error(errorMsg);
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => fetchJson('/health'),

  // Crop Management
  getCrops: () => fetchJson('/crops'),
  getCrop: (id) => fetchJson(`/crops/${id}`),
  createCrop: (cropData) => fetchJson('/crops', {
    method: 'POST',
    body: JSON.stringify(cropData),
  }),
  updateCrop: (id, cropData) => fetchJson(`/crops/${id}`, {
    method: 'PUT',
    body: JSON.stringify(cropData),
  }),
  deleteCrop: (id) => fetchJson(`/crops/${id}`, {
    method: 'DELETE',
  }),

  // Sensor Telemetry
  getLatestSensors: () => fetchJson('/sensors/latest'),
  getSensorHistory: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return fetchJson(`/sensors/history${searchParams ? `?${searchParams}` : ''}`);
  },
  triggerSimulation: (payload = {}) => fetchJson('/sensors/simulate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  ingestReading: (reading) => fetchJson('/sensors/reading', {
    method: 'POST',
    body: JSON.stringify(reading),
  }),

  // Smart Irrigation
  getIrrigationStatus: () => fetchJson('/irrigation/status'),
  simulateIrrigation: (payload) => fetchJson('/irrigation/simulate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getIrrigationLogs: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return fetchJson(`/irrigation/logs${searchParams ? `?${searchParams}` : ''}`);
  },

  // Alerts & Thresholds
  getAlerts: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return fetchJson(`/alerts${searchParams ? `?${searchParams}` : ''}`);
  },
  resolveAlert: (id) => fetchJson(`/alerts/${id}/resolve`, {
    method: 'PUT',
  }),
  resolveAllAlerts: () => fetchJson('/alerts/resolve-all', {
    method: 'POST',
  }),
  getThresholds: () => fetchJson('/alerts/thresholds'),
  updateThreshold: (id, payload) => fetchJson(`/alerts/thresholds/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),

  // Reports
  getReportSummary: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return fetchJson(`/reports/summary${searchParams ? `?${searchParams}` : ''}`);
  },
  getExportCsvUrl: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return `${API_BASE}/reports/export/csv${searchParams ? `?${searchParams}` : ''}`;
  },
};
