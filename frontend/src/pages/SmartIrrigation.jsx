import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  Clock,
  Waves,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import SimulatedBanner from '../components/SimulatedBanner';

export default function SmartIrrigation() {
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSimulationId, setActiveSimulationId] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(20);

  const loadIrrigationData = async () => {
    try {
      setLoading(true);
      const [statusRes, logsRes] = await Promise.all([
        api.getIrrigationStatus(),
        api.getIrrigationLogs({ limit: 20 }),
      ]);
      setRecommendations(statusRes.data || []);
      setSummary(statusRes.summary || {});
      setLogs(logsRes.data || []);
    } catch (err) {
      console.error('Failed to load irrigation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIrrigationData();
  }, []);

  const handleSimulatePump = async (cropId, action) => {
    try {
      setActiveSimulationId(cropId);
      await api.simulateIrrigation({
        crop_id: cropId,
        action,
        duration_minutes: selectedDuration,
        notes: `Simulated ${action} command triggered from Smart Irrigation view.`,
      });
      await loadIrrigationData();
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setActiveSimulationId(null);
    }
  };

  return (
    <div>
      <SimulatedBanner />

      {/* Main Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Smart Precision Irrigation Engine</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Real-time deficit evaluation, rainfall-delay algorithms, and simulated valve actuation.
        </p>
      </div>

      {/* Software Simulation Disclaimer Banner */}
      <div
        style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}
      >
        <ShieldAlert size={20} style={{ color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#92400e', fontSize: '0.875rem' }}>
            Safe Simulation Mode Notice
          </strong>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#b45309' }}>
            Turning irrigation ON or OFF simulates pump activation and replenishes virtual soil moisture in the database.
            No physical farm pumps or electrical relays are actuated by this demonstration software.
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="metrics-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card moisture">
          <div className="stat-header">
            <span className="stat-label">Crops Monitored</span>
            <Droplets size={20} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-value-group">
            <span className="stat-value">{summary.total_crops || 0}</span>
          </div>
          <div className="stat-subtext">Active agricultural parcel zones</div>
        </div>

        <div className="stat-card rain">
          <div className="stat-header">
            <span className="stat-label">Irrigation Recommended</span>
            <AlertCircle size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-value-group">
            <span className="stat-value">{summary.needing_irrigation || 0}</span>
            <span className="stat-unit">Plots</span>
          </div>
          <div className="stat-subtext">Moisture below designated crop threshold</div>
        </div>

        <div className="stat-card temp">
          <div className="stat-header">
            <span className="stat-label">Critical Deficit</span>
            <ShieldAlert size={20} style={{ color: '#ef4444' }} />
          </div>
          <div className="stat-value-group">
            <span className="stat-value">{summary.critical_count || 0}</span>
            <span className="stat-unit">Plots</span>
          </div>
          <div className="stat-subtext">Severe moisture shortage (&gt;10% deficit)</div>
        </div>

        <div className="stat-card humidity">
          <div className="stat-header">
            <span className="stat-label">Cycle Duration Preset</span>
            <Clock size={20} style={{ color: '#0284c7' }} />
          </div>
          <div className="stat-value-group">
            <select
              className="form-select"
              style={{ width: '100%', marginTop: '4px' }}
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
            >
              <option value={10}>10 Minutes (~150L)</option>
              <option value={20}>20 Minutes (~300L)</option>
              <option value={30}>30 Minutes (~450L)</option>
              <option value={45}>45 Minutes (~675L)</option>
            </select>
          </div>
          <div className="stat-subtext">Applies to manual simulated cycles</div>
        </div>
      </div>

      {/* Crop Recommendations Cards */}
      <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
        Automated Plot Irrigation Recommendations
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Evaluating soil moisture thresholds...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            No crop plots configured.
          </div>
        ) : (
          recommendations.map((rec) => {
            const isProcessing = activeSimulationId === rec.crop_id;
            return (
              <div
                key={rec.crop_id}
                className="card"
                style={{
                  borderLeft: `5px solid ${
                    rec.urgency === 'Critical'
                      ? '#ef4444'
                      : rec.urgency === 'Moderate'
                      ? '#f59e0b'
                      : '#10b981'
                  }`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{rec.crop_name}</h4>
                      <span
                        className={`badge badge-${
                          rec.urgency === 'Critical'
                            ? 'critical'
                            : rec.urgency === 'Moderate'
                            ? 'warning'
                            : 'optimal'
                        }`}
                      >
                        {rec.urgency}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '4px' }}>
                      Sector: <strong>{rec.field_name}</strong> | Target: <strong>{rec.threshold}%</strong> | Current: <strong style={{ color: rec.is_recommended ? '#ef4444' : '#10b981' }}>{rec.current_moisture}%</strong>
                    </div>

                    <p style={{ fontSize: '0.825rem', color: '#475569', marginTop: '6px' }}>
                      {rec.reason}
                    </p>

                    {rec.last_irrigated && (
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '4px' }}>
                        Last simulated irrigation: {new Date(rec.last_irrigated).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSimulatePump(rec.crop_id, 'PUMP_ON')}
                      disabled={isProcessing}
                    >
                      <Play size={14} />
                      <span>{isProcessing ? 'Simulating...' : 'Simulate Start (ON)'}</span>
                    </button>

                    <button
                      className="btn btn-secondary"
                      onClick={() => handleSimulatePump(rec.crop_id, 'PUMP_OFF')}
                      disabled={isProcessing}
                    >
                      <Square size={14} />
                      <span>Stop (OFF)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Historical Irrigation Activity Audit Logs */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Waves size={18} style={{ color: '#0284c7' }} />
            Irrigation Actuation Audit Trail
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Simulated Event Records</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Crop Plot</th>
                <th>Action</th>
                <th>Duration</th>
                <th>Est. Volume</th>
                <th>Moisture Change</th>
                <th>Trigger Mode</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    No irrigation logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <strong>{log.crop_name}</strong>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{log.field_name}</div>
                    </td>
                    <td>
                      <span
                        className={`badge badge-${
                          log.action === 'PUMP_ON' ? 'optimal' : 'info'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>{log.duration_minutes} mins</td>
                    <td>{log.water_volume_liters ? `${log.water_volume_liters} L` : '--'}</td>
                    <td>
                      {log.soil_moisture_before !== null && log.soil_moisture_after !== null ? (
                        <span>
                          {log.soil_moisture_before}% &rarr;{' '}
                          <strong style={{ color: '#10b981' }}>{log.soil_moisture_after}%</strong>
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                        {log.mode}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {log.notes || '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
