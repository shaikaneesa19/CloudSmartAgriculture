import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  Flame,
  Filter,
  CheckCircle2,
  Clock,
  Battery,
  AlertCircle,
  Plus,
  Radio,
} from 'lucide-react';
import { api } from '../services/api';
import SimulatedBanner from '../components/SimulatedBanner';
import Modal from '../components/Modal';

export default function SensorMonitoring() {
  const [readings, setReadings] = useState([]);
  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState('');
  const [timeframe, setTimeframe] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false);

  const [testPayload, setTestPayload] = useState({
    crop_id: '',
    temperature: 28.5,
    humidity: 62.0,
    soil_moisture: 25.0,
    rainfall: 0.0,
    battery_level: 96.0,
    status: 'Normal',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params = { timeframe, limit: 100 };
      if (selectedCropId) params.crop_id = selectedCropId;

      const [historyRes, cropsRes] = await Promise.all([
        api.getSensorHistory(params),
        api.getCrops(),
      ]);

      // Reverse so newest first in the feed table
      setReadings((historyRes.data || []).slice().reverse());
      setCrops(cropsRes.data || []);
    } catch (err) {
      console.error('Failed to load sensor feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeframe, selectedCropId]);

  const handleSimulateCycle = async (forceDry = false) => {
    try {
      setIsSimulating(true);
      await api.triggerSimulation({
        crop_id: selectedCropId ? parseInt(selectedCropId) : null,
        force_dry: forceDry,
      });
      await loadData();
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleInjectReading = async (e) => {
    e.preventDefault();
    try {
      await api.ingestReading({
        crop_id: testPayload.crop_id ? parseInt(testPayload.crop_id) : null,
        temperature: parseFloat(testPayload.temperature),
        humidity: parseFloat(testPayload.humidity),
        soil_moisture: parseFloat(testPayload.soil_moisture),
        rainfall: parseFloat(testPayload.rainfall),
        battery_level: parseFloat(testPayload.battery_level),
        is_simulated: true,
        status: testPayload.status,
      });
      setIsInjectModalOpen(false);
      await loadData();
    } catch (err) {
      alert(`Ingest error: ${err.message}`);
    }
  };

  return (
    <div>
      <SimulatedBanner />

      {/* Header and Simulation Trigger Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>IoT Sensor Monitoring Stream</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            High-frequency agricultural telemetry stream with multi-channel environmental metrics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => handleSimulateCycle(false)}
            disabled={isSimulating}
          >
            <Zap size={16} />
            <span>{isSimulating ? 'Generating...' : 'Simulate Telemetry Pulse'}</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => handleSimulateCycle(true)}
            disabled={isSimulating}
            title="Forces low soil moisture readings to trigger warnings"
          >
            <Flame size={16} style={{ color: '#ef4444' }} />
            <span>Simulate Drought Stress</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setIsInjectModalOpen(true)}
          >
            <Plus size={16} />
            <span>Inject Test Reading</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} style={{ color: '#64748b' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter Plot:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
            >
              <option value="">All Crop Plots</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.field_name})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Window:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="24h">Past 24 Hours</option>
              <option value="7d">Past 7 Days</option>
              <option value="30d">Past 30 Days</option>
              <option value="all">Full History</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Showing <strong>{readings.length}</strong> logged telemetry packets
        </div>
      </div>

      {/* Sensor Stream Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Crop & Field</th>
                <th>Soil Moisture</th>
                <th>Temperature</th>
                <th>Humidity</th>
                <th>Rainfall</th>
                <th>Battery</th>
                <th>Data Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem' }}>
                    Loading telemetry stream...
                  </td>
                </tr>
              ) : readings.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem' }}>
                    No readings found for selected criteria. Click "Simulate Telemetry Pulse" above to generate data.
                  </td>
                </tr>
              ) : (
                readings.map((r) => {
                  const date = new Date(r.timestamp);
                  const formattedTime = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                          <Clock size={13} style={{ color: '#94a3b8' }} />
                          <span>{formattedTime}</span>
                        </div>
                      </td>
                      <td>
                        <strong>{r.crop_name}</strong>
                        <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{r.field_name}</div>
                      </td>
                      <td>
                        <strong
                          style={{
                            color:
                              r.soil_moisture < 30 ? '#ef4444' : r.soil_moisture < 40 ? '#f59e0b' : '#10b981',
                          }}
                        >
                          {r.soil_moisture}%
                        </strong>
                      </td>
                      <td>{r.temperature}°C</td>
                      <td>{r.humidity}%</td>
                      <td>
                        {r.rainfall > 0 ? (
                          <span style={{ color: '#0284c7', fontWeight: 600 }}>{r.rainfall} mm</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>0.0 mm</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.775rem' }}>
                          <Battery size={13} style={{ color: '#10b981' }} />
                          <span>{r.battery_level}%</span>
                        </div>
                      </td>
                      <td>
                        {r.is_simulated ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              border: '1px solid #bfdbfe',
                            }}
                          >
                            <Radio size={10} />
                            Simulated
                          </span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                            }}
                          >
                            Physical Hardware
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge badge-${
                            r.status === 'Critical' ? 'critical' : r.status === 'Warning' ? 'warning' : 'optimal'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inject Test Reading Modal */}
      <Modal
        isOpen={isInjectModalOpen}
        onClose={() => setIsInjectModalOpen(false)}
        title="Inject Custom Simulated Reading"
      >
        <form onSubmit={handleInjectReading}>
          <div className="form-group">
            <label className="form-label">Target Crop Plot</label>
            <select
              className="form-select"
              value={testPayload.crop_id}
              onChange={(e) => setTestPayload({ ...testPayload, crop_id: e.target.value })}
            >
              <option value="">General Field</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.field_name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Soil Moisture (%)</label>
              <input
                type="number"
                step="0.1"
                required
                className="form-input"
                value={testPayload.soil_moisture}
                onChange={(e) => setTestPayload({ ...testPayload, soil_moisture: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                required
                className="form-input"
                value={testPayload.temperature}
                onChange={(e) => setTestPayload({ ...testPayload, temperature: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Humidity (%)</label>
              <input
                type="number"
                step="0.1"
                required
                className="form-input"
                value={testPayload.humidity}
                onChange={(e) => setTestPayload({ ...testPayload, humidity: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rainfall (mm)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={testPayload.rainfall}
                onChange={(e) => setTestPayload({ ...testPayload, rainfall: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsInjectModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Send Telemetry Packet
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
