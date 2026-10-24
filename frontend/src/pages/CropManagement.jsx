import React, { useState, useEffect } from 'react';
import { Sprout, Plus, Edit2, Trash2, Calendar, MapPin, Droplets, Thermometer, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export default function CropManagement() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    field_name: '',
    crop_type: 'Vegetable',
    planting_date: new Date().toISOString().split('T')[0],
    expected_harvest: '',
    soil_moisture_threshold: 35.0,
    ideal_temp_min: 18.0,
    ideal_temp_max: 32.0,
    notes: '',
  });

  const loadCrops = async () => {
    try {
      setLoading(true);
      const res = await api.getCrops();
      setCrops(res.data || []);
    } catch (err) {
      console.error('Failed to load crops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrops();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedCropId(null);
    setFormData({
      name: '',
      field_name: '',
      crop_type: 'Vegetable',
      planting_date: new Date().toISOString().split('T')[0],
      expected_harvest: '',
      soil_moisture_threshold: 35.0,
      ideal_temp_min: 18.0,
      ideal_temp_max: 32.0,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (crop) => {
    setIsEditing(true);
    setSelectedCropId(crop.id);
    setFormData({
      name: crop.name,
      field_name: crop.field_name,
      crop_type: crop.crop_type || 'Vegetable',
      planting_date: crop.planting_date,
      expected_harvest: crop.expected_harvest || '',
      soil_moisture_threshold: crop.soil_moisture_threshold,
      ideal_temp_min: crop.ideal_temp_min || 18.0,
      ideal_temp_max: crop.ideal_temp_max || 32.0,
      notes: crop.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.updateCrop(selectedCropId, formData);
      } else {
        await api.createCrop(formData);
      }
      setIsModalOpen(false);
      await loadCrops();
    } catch (err) {
      alert(`Error saving crop: ${err.message}`);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete crop record "${name}"? Associated sensor telemetry will be purged.`)) {
      try {
        await api.deleteCrop(id);
        await loadCrops();
      } catch (err) {
        alert(`Failed to delete crop: ${err.message}`);
      }
    }
  };

  return (
    <div>
      {/* Header with Add Crop Button */}
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Agricultural Crop Directory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage parcel fields, growth cycles, and soil moisture irrigation thresholds.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} />
          <span>Add New Crop</span>
        </button>
      </div>

      {/* Crops Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading crop records...
        </div>
      ) : crops.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Sprout size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
          <h3>No crops configured</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Get started by adding your first field plot.
          </p>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} /> Add First Crop
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {crops.map((crop) => (
            <div key={crop.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ marginBottom: '1rem' }}>
                <div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#059669',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {crop.crop_type}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', marginTop: '2px' }}>{crop.name}</h3>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEditModal(crop)}
                    title="Edit Crop"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(crop.id, crop.name)}
                    title="Delete Crop"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Status and Field info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  fontSize: '0.825rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#475569' }}>
                  <MapPin size={15} style={{ color: '#10b981' }} />
                  <strong>{crop.field_name}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#475569' }}>
                  <Calendar size={15} style={{ color: '#0284c7' }} />
                  <span>Planted: {crop.planting_date}</span>
                </div>
              </div>

              {/* Moisture & Thermal Parameters */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'white',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.75rem' }}>
                    <Droplets size={14} style={{ color: '#10b981' }} />
                    <span>Moisture Threshold</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px', color: '#0f172a' }}>
                    {crop.soil_moisture_threshold}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Current: <strong>{crop.current_moisture !== null ? `${crop.current_moisture}%` : 'N/A'}</strong>
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'white',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.75rem' }}>
                    <Thermometer size={14} style={{ color: '#f97316' }} />
                    <span>Ideal Temp Range</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px', color: '#0f172a' }}>
                    {crop.ideal_temp_min}° - {crop.ideal_temp_max}°C
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Current: <strong>{crop.current_temperature !== null ? `${crop.current_temperature}°C` : 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {crop.notes && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginTop: 'auto', paddingTop: '0.5rem' }}>
                  "{crop.notes}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Crop Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Crop Details' : 'Add New Agricultural Crop'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Crop / Variety Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Heirloom Tomatoes"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Field / Sector Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.field_name}
                onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                placeholder="e.g. North Plot B"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={formData.crop_type}
                onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
              >
                <option value="Vegetables">Vegetables</option>
                <option value="Grain / Cereal">Grain / Cereal</option>
                <option value="Orchard / Fruits">Orchard / Fruits</option>
                <option value="Legumes">Legumes</option>
                <option value="Fodder">Fodder</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Planting Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.planting_date}
                onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Harvest</label>
              <input
                type="date"
                className="form-input"
                value={formData.expected_harvest}
                onChange={(e) => setFormData({ ...formData, expected_harvest: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Soil Moisture Threshold (%) *</label>
            <input
              type="number"
              step="0.5"
              min="5"
              max="90"
              required
              className="form-input"
              value={formData.soil_moisture_threshold}
              onChange={(e) => setFormData({ ...formData, soil_moisture_threshold: parseFloat(e.target.value) })}
            />
            <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
              Triggers smart irrigation recommendations when soil moisture falls below this limit.
            </span>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Min Ideal Temp (°C)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={formData.ideal_temp_min}
                onChange={(e) => setFormData({ ...formData, ideal_temp_min: parseFloat(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Ideal Temp (°C)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={formData.ideal_temp_max}
                onChange={(e) => setFormData({ ...formData, ideal_temp_max: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Field Notes / Irrigation Method</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Drip irrigation line with soil sensor installed at 20cm depth."
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Create Crop'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
