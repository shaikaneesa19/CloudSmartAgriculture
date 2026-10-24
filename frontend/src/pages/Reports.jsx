import React, { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  Filter,
  BarChart3,
  Droplets,
  Thermometer,
  Wind,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../services/api';
import MetricCard from '../components/MetricCard';
import SensorChart from '../components/SensorChart';

export default function Reports() {
  const [timeframe, setTimeframe] = useState('7d');
  const [selectedCropId, setSelectedCropId] = useState('');
  const [crops, setCrops] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    try {
      setLoading(true);
      const params = { timeframe };
      if (selectedCropId) params.crop_id = selectedCropId;

      const [summaryRes, historyRes, cropsRes] = await Promise.all([
        api.getReportSummary(params),
        api.getSensorHistory({ timeframe, limit: 120, ...(selectedCropId && { crop_id: selectedCropId }) }),
        api.getCrops(),
      ]);

      setReportData(summaryRes);
      setHistoryData(historyRes.data || []);
      setCrops(cropsRes.data || []);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [timeframe, selectedCropId]);

  const handleExportCsv = () => {
    const params = { timeframe };
    if (selectedCropId) params.crop_id = selectedCropId;
    const url = api.getExportCsvUrl(params);
    window.open(url, '_blank');
  };

  // Format Chart Datasets
  const chartLabels = historyData.map((d) => {
    const date = new Date(d.timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
  });

  const moistureDataset = {
    label: 'Soil Moisture (%)',
    data: historyData.map((d) => d.soil_moisture),
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  };

  const tempDataset = {
    label: 'Temperature (°C)',
    data: historyData.map((d) => d.temperature),
    borderColor: '#f97316',
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  };

  const humidityDataset = {
    label: 'Humidity (%)',
    data: historyData.map((d) => d.humidity),
    borderColor: '#0284c7',
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  };

  const metrics = reportData?.metrics || {};

  return (
    <div>
      {/* Title & CSV Export Action */}
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Agronomic Performance & Historical Reports</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Comprehensive analytics, environmental range distributions, and raw CSV telemetry export.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleExportCsv}>
          <Download size={16} />
          <span>Export Sensor Readings to CSV</span>
        </button>
      </div>

      {/* Filter Controls Toolbar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} style={{ color: '#64748b' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Period:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Available Records</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} style={{ color: '#64748b' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Crop Filter:</span>
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
        </div>

        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Total Packets Processed: <strong>{reportData?.total_readings || 0}</strong>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="metrics-grid" style={{ marginBottom: '1.75rem' }}>
        <MetricCard
          label="Soil Moisture Avg"
          value={metrics.soil_moisture?.avg}
          unit="%"
          type="moisture"
          icon={<Droplets size={22} style={{ color: '#10b981' }} />}
          subtext={`Range: ${metrics.soil_moisture?.min || 0}% - ${metrics.soil_moisture?.max || 0}%`}
        />

        <MetricCard
          label="Temperature Avg"
          value={metrics.temperature?.avg}
          unit="°C"
          type="temp"
          icon={<Thermometer size={22} style={{ color: '#f97316' }} />}
          subtext={`Min: ${metrics.temperature?.min || 0}°C | Max: ${metrics.temperature?.max || 0}°C`}
        />

        <MetricCard
          label="Water Volume Dispensed"
          value={reportData?.irrigation_summary?.total_liters}
          unit="L"
          type="rain"
          icon={<Droplets size={22} style={{ color: '#0284c7' }} />}
          subtext={`Across ${reportData?.irrigation_summary?.total_events || 0} simulated cycles`}
          badgeText="Estimated"
          badgeType="info"
        />

        <MetricCard
          label="Atmospheric Humidity"
          value={metrics.humidity?.avg}
          unit="%"
          type="humidity"
          icon={<Wind size={22} style={{ color: '#8b5cf6' }} />}
          subtext={`Min: ${metrics.humidity?.min || 0}% | Max: ${metrics.humidity?.max || 0}%`}
        />
      </div>

      {/* Historical Trend Charts */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <BarChart3 size={18} style={{ color: '#10b981' }} />
            Aggregated Multi-Channel Environmental Timeline
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Timeframe: {timeframe}</span>
        </div>

        {chartLabels.length > 0 ? (
          <SensorChart
            labels={chartLabels}
            datasets={[moistureDataset, tempDataset, humidityDataset]}
            height={320}
            yAxisLabel="Sensor Metric Values"
          />
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            No sensor telemetry available for selected timeframe.
          </div>
        )}
      </div>

      {/* Plot-by-Plot Health Breakdown Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Parcel Plot Stress & Moisture Summary</h3>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCsv}>
            <FileSpreadsheet size={14} />
            <span>Download CSV</span>
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Crop Plot</th>
                <th>Field Sector</th>
                <th>Telemetry Count</th>
                <th>Average Moisture</th>
                <th>Current Level</th>
                <th>Threshold Limit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData?.crops_breakdown?.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No crop plot metrics recorded in this interval.
                  </td>
                </tr>
              ) : (
                reportData?.crops_breakdown?.map((c) => (
                  <tr key={c.crop_id}>
                    <td>
                      <strong>{c.crop_name}</strong>
                    </td>
                    <td>{c.field_name}</td>
                    <td>{c.reading_count} readings</td>
                    <td>{c.avg_moisture}%</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: c.is_stressed ? '#ef4444' : '#10b981',
                        }}
                      >
                        {c.current_moisture}%
                      </span>
                    </td>
                    <td>{c.threshold}%</td>
                    <td>
                      <span
                        className={`badge badge-${
                          c.is_stressed ? 'critical' : 'optimal'
                        }`}
                      >
                        {c.is_stressed ? 'Water Stress' : 'Optimal'}
                      </span>
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
