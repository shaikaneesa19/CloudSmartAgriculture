import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Sliders,
  CheckCheck,
  Clock,
  Edit2,
  Save,
  X,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [summary, setSummary] = useState({});
  const [filterResolved, setFilterResolved] = useState('false'); // 'false', 'true', ''
  const [loading, setLoading] = useState(true);

  // Edit threshold modal
  const [editingThreshold, setEditingThreshold] = useState(null);
  const [thresholdForm, setThresholdForm] = useState({
    min_value: '',
    max_value: '',
    description: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterResolved !== '') {
        params.is_resolved = filterResolved;
      }

      const [alertsRes, thresholdsRes] = await Promise.all([
        api.getAlerts(params),
        api.getThresholds(),
      ]);

      setAlerts(alertsRes.data || []);
      setSummary(alertsRes.summary || {});
      setThresholds(thresholdsRes.data || []);
    } catch (err) {
      console.error('Failed to load alerts & thresholds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterResolved]);

  const handleResolve = async (id) => {
    try {
      await api.resolveAlert(id);
      await loadData();
    } catch (err) {
      alert(`Error resolving alert: ${err.message}`);
    }
  };

  const handleResolveAll = async () => {
    if (window.confirm('Mark all active environmental alerts as resolved?')) {
      try {
        await api.resolveAllAlerts();
        await loadData();
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleOpenEditThreshold = (t) => {
    setEditingThreshold(t);
    setThresholdForm({
      min_value: t.min_value !== null ? t.min_value : '',
      max_value: t.max_value !== null ? t.max_value : '',
      description: t.description || '',
    });
  };

  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    if (!editingThreshold) return;

    try {
      await api.updateThreshold(editingThreshold.id, {
        min_value: thresholdForm.min_value !== '' ? parseFloat(thresholdForm.min_value) : null,
        max_value: thresholdForm.max_value !== '' ? parseFloat(thresholdForm.max_value) : null,
        description: thresholdForm.description,
      });
      setEditingThreshold(null);
      await loadData();
    } catch (err) {
      alert(`Failed to update threshold: ${err.message}`);
    }
  };

  return (
    <div>
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Environmental Alerts & Thresholds</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Automated anomaly detection rules for thermal stress, drought conditions, and excessive rainfall.
          </p>
        </div>

        {summary.active_total > 0 && (
          <button className="btn btn-secondary" onClick={handleResolveAll}>
            <CheckCheck size={16} />
            <span>Resolve All Active</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card temp">
          <div className="stat-header">
            <span className="stat-label">Active Critical</span>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
          </div>
          <div className="stat-value-group">
            <span className="stat-value">{summary.active_critical || 0}</span>
            <span className="stat-unit">Alerts</span>
          </div>
          <div className="stat-subtext">Requires immediate intervention</div>
        </div>

        <div className="stat-card rain">
          <div className="stat-header">
            <span className="stat-label">Active Warnings</span>
            <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-value-group">
            <span className="stat-value">{summary.active_warning || 0}</span>
            <span className="stat-unit">Alerts</span>
          </div>
          <div className="stat-subtext">Boundary threshold breached</div>
        </div>

        <div className="stat-card moisture">
          <div className="stat-header">
            <span className="stat-label">Active Total</span>
            <CheckCircle size={20} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-value-group">
            <span className="stat-value">{summary.active_total || 0}</span>
          </div>
          <div className="stat-subtext">Pending operator review</div>
        </div>
      </div>

      {/* Configurable Threshold Settings Section */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <Sliders size={18} style={{ color: '#059669' }} />
            Configurable Metric Threshold Limits
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Customizable Rules</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Environmental Metric</th>
                <th>Safe Min Limit</th>
                <th>Safe Max Limit</th>
                <th>Unit</th>
                <th>Trigger Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {thresholds.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong style={{ textTransform: 'capitalize' }}>
                      {t.metric_name.replace(/_/g, ' ')}
                    </strong>
                  </td>
                  <td>{t.min_value !== null ? t.min_value : 'None'}</td>
                  <td>{t.max_value !== null ? t.max_value : 'None'}</td>
                  <td>{t.unit}</td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.description}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEditThreshold(t)}
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts Feed Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Alert History & Logs</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={14} style={{ color: '#64748b' }} />
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.25rem 0.65rem', fontSize: '0.8rem' }}
              value={filterResolved}
              onChange={(e) => setFilterResolved(e.target.value)}
            >
              <option value="false">Unresolved Only</option>
              <option value="true">Resolved History</option>
              <option value="">All Records</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Severity</th>
                <th>Type</th>
                <th>Crop Plot</th>
                <th>Condition & Metric</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading alerts...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#10b981' }}>
                    <CheckCircle size={28} style={{ display: 'block', margin: '0 auto 0.5rem' }} />
                    No alerts matching filter criteria. Systems are functioning normally.
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(a.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge badge-${
                          a.severity === 'Critical'
                            ? 'critical'
                            : a.severity === 'Warning'
                            ? 'warning'
                            : 'info'
                        }`}
                      >
                        {a.severity}
                      </span>
                    </td>
                    <td>
                      <strong>{a.alert_type.replace(/_/g, ' ')}</strong>
                    </td>
                    <td>
                      <div>{a.crop_name}</div>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{a.field_name}</div>
                    </td>
                    <td style={{ fontSize: '0.825rem' }}>
                      {a.message}
                      {a.metric_value !== null && (
                        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px' }}>
                          Recorded: <strong>{a.metric_value}</strong> (Threshold: {a.threshold_value})
                        </div>
                      )}
                    </td>
                    <td>
                      {a.is_resolved ? (
                        <span style={{ color: '#10b981', fontSize: '0.775rem', fontWeight: 600 }}>
                          Resolved
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', fontSize: '0.775rem', fontWeight: 700 }}>
                          Active
                        </span>
                      )}
                    </td>
                    <td>
                      {!a.is_resolved ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleResolve(a.id)}
                        >
                          Resolve
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>--</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Threshold Modal */}
      <Modal
        isOpen={!!editingThreshold}
        onClose={() => setEditingThreshold(null)}
        title={`Edit Threshold for ${editingThreshold?.metric_name.replace(/_/g, ' ')}`}
      >
        <form onSubmit={handleSaveThreshold}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                Minimum Allowed Value ({editingThreshold?.unit})
              </label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={thresholdForm.min_value}
                onChange={(e) => setThresholdForm({ ...thresholdForm, min_value: e.target.value })}
                placeholder="Leave blank if no minimum"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Maximum Allowed Value ({editingThreshold?.unit})
              </label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={thresholdForm.max_value}
                onChange={(e) => setThresholdForm({ ...thresholdForm, max_value: e.target.value })}
                placeholder="Leave blank if no maximum"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Farmer Guidance</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={thresholdForm.description}
              onChange={(e) => setThresholdForm({ ...thresholdForm, description: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingThreshold(null)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={14} />
              <span>Save Limits</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
