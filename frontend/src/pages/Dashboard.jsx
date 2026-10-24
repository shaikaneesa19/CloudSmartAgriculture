import React, { useState, useEffect } from 'react';
import {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  AlertTriangle,
  CheckCircle,
  Play,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import MetricCard from '../components/MetricCard';
import SensorChart from '../components/SensorChart';
import SimulatedBanner from '../components/SimulatedBanner';

export default function Dashboard({ onNavigate }) {
  const [latestData, setLatestData] = useState([]);
  const [summary, setSummary] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [irrigationStatus, setIrrigationStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulatingIrrigationId, setSimulatingIrrigationId] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [latestRes, historyRes, alertsRes, irrigationRes] = await Promise.all([
        api.getLatestSensors(),
        api.getSensorHistory({ timeframe: '24h', limit: 30 }),
        api.getAlerts({ is_resolved: false, limit: 5 }),
        api.getIrrigationStatus(),
      ]);

      setLatestData(latestRes.data || []);
      setSummary(latestRes.summary || {});
      setHistoryData(historyRes.data || []);
      setAlerts(alertsRes.data || []);
      setIrrigationStatus(irrigationRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickIrrigate = async (cropId) => {
    try {
      setSimulatingIrrigationId(cropId);
      await api.simulateIrrigation({
        crop_id: cropId,
        action: 'PUMP_ON',
        duration_minutes: 15,
        notes: 'One-click quick irrigation replenishment from Dashboard',
      });
      await loadDashboardData();
    } catch (err) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setSimulatingIrrigationId(null);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await api.resolveAlert(alertId);
      setAlerts(alerts.filter((a) => a.id !== alertId));
    } catch (err) {
      alert(`Failed to resolve alert: ${err.message}`);
    }
  };

  // Prepare chart datasets from history
  const chartLabels = historyData.map((d) => {
    const date = new Date(d.timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  });

  const soilMoistureDataset = {
    label: 'Soil Moisture (%)',
    data: historyData.map((d) => d.soil_moisture),
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    yAxisID: 'y',
  };

  const tempDataset = {
    label: 'Temperature (°C)',
    data: historyData.map((d) => d.temperature),
    borderColor: '#f97316',
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    yAxisID: 'y',
  };

  // Crop soil vs threshold bar chart
  const cropBarLabels = latestData.map((c) => c.crop_name || c.field_name);
  const cropBarCurrent = {
    label: 'Current Moisture (%)',
    data: latestData.map((c) => c.soil_moisture),
    backgroundColor: latestData.map((c) =>
      c.soil_moisture < c.soil_moisture_threshold ? '#ef4444' : '#10b981'
    ),
    borderRadius: 6,
  };
  const cropBarThreshold = {
    label: 'Required Threshold (%)',
    data: latestData.map((c) => c.soil_moisture_threshold || 35),
    backgroundColor: '#cbd5e1',
    borderRadius: 6,
  };

  return (
    <div>
      <SimulatedBanner />

      {/* Primary KPI Metrics Grid */}
      <div className="metrics-grid">
        <MetricCard
          label="Avg Soil Moisture"
          value={summary.avg_soil_moisture}
          unit="%"
          type="moisture"
          icon={<Droplets size={22} style={{ color: '#10b981' }} />}
          subtext="Root zone saturation index"
          badgeText={summary.avg_soil_moisture < 35 ? 'Attention' : 'Optimal'}
          badgeType={summary.avg_soil_moisture < 35 ? 'warning' : 'optimal'}
        />

        <MetricCard
          label="Canopy Temperature"
          value={summary.avg_temperature}
          unit="°C"
          type="temp"
          icon={<Thermometer size={22} style={{ color: '#f97316' }} />}
          subtext="Field ambient thermal sensor"
          badgeText={summary.avg_temperature > 32 ? 'High' : 'Normal'}
          badgeType={summary.avg_temperature > 32 ? 'warning' : 'optimal'}
        />

        <MetricCard
          label="Atmospheric Humidity"
          value={summary.avg_humidity}
          unit="%"
          type="humidity"
          icon={<Wind size={22} style={{ color: '#0284c7' }} />}
          subtext="Relative ambient moisture"
          badgeText="Good"
          badgeType="optimal"
        />

        <MetricCard
          label="Precipitation"
          value={summary.total_rainfall_recent}
          unit="mm"
          type="rain"
          icon={<CloudRain size={22} style={{ color: '#8b5cf6' }} />}
          subtext="Rainfall recorded in past 24h"
          badgeText={summary.total_rainfall_recent > 0 ? 'Rain Active' : 'Dry'}
          badgeType={summary.total_rainfall_recent > 0 ? 'info' : 'optimal'}
        />
      </div>

      {/* Charts Section */}
      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={18} style={{ color: '#10b981' }} />
              24-Hour Soil Moisture & Temperature Trends
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Simulated Telemetry</span>
          </div>
          {chartLabels.length > 0 ? (
            <SensorChart
              labels={chartLabels}
              datasets={[soilMoistureDataset, tempDataset]}
              height={260}
              yAxisLabel="Readings"
            />
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              Gathering telemetry readings...
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Droplets size={18} style={{ color: '#0284c7' }} />
              Crop Moisture vs. Minimum Threshold
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Deficit Analysis</span>
          </div>
          {cropBarLabels.length > 0 ? (
            <SensorChart
              type="bar"
              labels={cropBarLabels}
              datasets={[cropBarCurrent, cropBarThreshold]}
              height={260}
              yAxisLabel="Moisture %"
            />
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              No crop sectors configured yet.
            </div>
          )}
        </div>
      </div>

      {/* Lower Row: Field Telemetry Table & Alerts/Irrigation sidebar */}
      <div className="grid-2">
        {/* Field-by-Field Live Matrix */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sector Real-time Crop Matrix</h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('crops')}
            >
              <span>Manage Crops</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Crop & Sector</th>
                  <th>Moisture</th>
                  <th>Temp</th>
                  <th>Status</th>
                  <th>Irrigation</th>
                </tr>
              </thead>
              <tbody>
                {latestData.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                      No active telemetry.
                    </td>
                  </tr>
                ) : (
                  latestData.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.crop_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {item.field_name}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: item.needs_irrigation ? '#ef4444' : '#10b981',
                          }}
                        >
                          {item.soil_moisture}%
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {' '}
                          / {item.soil_moisture_threshold}% target
                        </span>
                      </td>
                      <td>{item.temperature}°C</td>
                      <td>
                        <span
                          className={`badge badge-${
                            item.status === 'Critical'
                              ? 'critical'
                              : item.status === 'Warning'
                              ? 'warning'
                              : 'optimal'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {item.needs_irrigation ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleQuickIrrigate(item.crop_id)}
                            disabled={simulatingIrrigationId === item.crop_id}
                          >
                            <Play size={12} />
                            <span>
                              {simulatingIrrigationId === item.crop_id
                                ? 'Pumping...'
                                : 'Simulate'}
                            </span>
                          </button>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#10b981',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            <CheckCircle size={14} /> Optimal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts & Smart Irrigation Recommendations Widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Smart Irrigation Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Droplets size={18} style={{ color: '#10b981' }} />
                Smart Irrigation Dispatcher
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate('irrigation')}
              >
                Full Controls
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {irrigationStatus.slice(0, 3).map((rec) => (
                <div
                  key={rec.crop_id}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: rec.is_recommended ? '#fef2f2' : '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                      {rec.crop_name} ({rec.field_name})
                    </div>
                    <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                      {rec.reason}
                    </div>
                  </div>

                  {rec.is_recommended && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleQuickIrrigate(rec.crop_id)}
                      disabled={simulatingIrrigationId === rec.crop_id}
                      style={{ flexShrink: 0 }}
                    >
                      <Play size={12} />
                      <span>
                        {simulatingIrrigationId === rec.crop_id ? 'Pumping...' : 'Irrigate'}
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active Alerts Snippet */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                Environmental Active Alerts ({alerts.length})
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate('alerts')}
              >
                All Alerts
              </button>
            </div>

            {alerts.length === 0 ? (
              <div
                style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  color: '#10b981',
                  backgroundColor: '#ecfdf5',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                <CheckCircle size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                All environmental metrics within normal thresholds!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {alerts.map((alertItem) => (
                  <div
                    key={alertItem.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #fecaca',
                      backgroundColor: '#fff5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          color: '#b91c1c',
                        }}
                      >
                        {alertItem.alert_type.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: '#4b5563' }}>
                        {alertItem.message}
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleResolveAlert(alertItem.id)}
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                    >
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
