from datetime import datetime
from backend.database import db

class Crop(db.Model):
    __tablename__ = 'crops'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    field_name = db.Column(db.String(100), nullable=False)
    crop_type = db.Column(db.String(50), nullable=False, default='Vegetable')
    planting_date = db.Column(db.String(20), nullable=False)
    expected_harvest = db.Column(db.String(20), nullable=True)
    soil_moisture_threshold = db.Column(db.Float, nullable=False, default=35.0)  # % moisture threshold
    ideal_temp_min = db.Column(db.Float, default=18.0)
    ideal_temp_max = db.Column(db.Float, default=32.0)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    readings = db.relationship('SensorReading', backref='crop', lazy='dynamic', cascade='all, delete-orphan')
    irrigation_logs = db.relationship('IrrigationLog', backref='crop', lazy='dynamic', cascade='all, delete-orphan')
    alerts = db.relationship('Alert', backref='crop', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        latest_reading = self.readings.order_by(SensorReading.timestamp.desc()).first()
        current_moisture = latest_reading.soil_moisture if latest_reading else None
        current_temp = latest_reading.temperature if latest_reading else None
        
        # Determine status
        health_status = 'Optimal'
        if current_moisture is not None and current_moisture < (self.soil_moisture_threshold - 10):
            health_status = 'Critical'
        elif current_moisture is not None and current_moisture < self.soil_moisture_threshold:
            health_status = 'Warning'
        elif current_temp is not None and (current_temp > self.ideal_temp_max or current_temp < self.ideal_temp_min):
            health_status = 'Caution'

        return {
            'id': self.id,
            'name': self.name,
            'field_name': self.field_name,
            'crop_type': self.crop_type,
            'planting_date': self.planting_date,
            'expected_harvest': self.expected_harvest,
            'soil_moisture_threshold': self.soil_moisture_threshold,
            'ideal_temp_min': self.ideal_temp_min,
            'ideal_temp_max': self.ideal_temp_max,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'current_moisture': current_moisture,
            'current_temperature': current_temp,
            'health_status': health_status,
            'needs_irrigation': (current_moisture < self.soil_moisture_threshold) if current_moisture is not None else False
        }


class SensorReading(db.Model):
    __tablename__ = 'sensor_readings'

    id = db.Column(db.Integer, primary_key=True)
    crop_id = db.Column(db.Integer, db.ForeignKey('crops.id', ondelete='CASCADE'), nullable=True)
    field_name = db.Column(db.String(100), nullable=False)
    temperature = db.Column(db.Float, nullable=False)        # Celsius
    humidity = db.Column(db.Float, nullable=False)           # %
    soil_moisture = db.Column(db.Float, nullable=False)      # %
    rainfall = db.Column(db.Float, nullable=False, default=0.0) # mm
    battery_level = db.Column(db.Float, default=98.0)        # %
    is_simulated = db.Column(db.Boolean, default=True)       # Flag identifying simulated telemetry
    status = db.Column(db.String(20), default='Normal')      # Normal, Warning, Critical
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'crop_id': self.crop_id,
            'crop_name': self.crop.name if self.crop else 'Unassigned',
            'field_name': self.field_name,
            'temperature': round(self.temperature, 1),
            'humidity': round(self.humidity, 1),
            'soil_moisture': round(self.soil_moisture, 1),
            'rainfall': round(self.rainfall, 1),
            'battery_level': round(self.battery_level, 1),
            'is_simulated': self.is_simulated,
            'status': self.status,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


class IrrigationLog(db.Model):
    __tablename__ = 'irrigation_logs'

    id = db.Column(db.Integer, primary_key=True)
    crop_id = db.Column(db.Integer, db.ForeignKey('crops.id', ondelete='CASCADE'), nullable=True)
    field_name = db.Column(db.String(100), nullable=False)
    action = db.Column(db.String(50), nullable=False)        # PUMP_ON, PUMP_OFF, CYCLE_COMPLETED
    mode = db.Column(db.String(20), default='Manual_Simulated') # Manual_Simulated, Automated_AI
    duration_minutes = db.Column(db.Integer, default=15)
    water_volume_liters = db.Column(db.Float, default=150.0)
    soil_moisture_before = db.Column(db.Float, nullable=True)
    soil_moisture_after = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(20), default='Completed')
    notes = db.Column(db.String(255), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'crop_id': self.crop_id,
            'crop_name': self.crop.name if self.crop else 'All Fields',
            'field_name': self.field_name,
            'action': self.action,
            'mode': self.mode,
            'duration_minutes': self.duration_minutes,
            'water_volume_liters': round(self.water_volume_liters, 1) if self.water_volume_liters else None,
            'soil_moisture_before': round(self.soil_moisture_before, 1) if self.soil_moisture_before is not None else None,
            'soil_moisture_after': round(self.soil_moisture_after, 1) if self.soil_moisture_after is not None else None,
            'status': self.status,
            'notes': self.notes,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


class Alert(db.Model):
    __tablename__ = 'alerts'

    id = db.Column(db.Integer, primary_key=True)
    crop_id = db.Column(db.Integer, db.ForeignKey('crops.id', ondelete='CASCADE'), nullable=True)
    field_name = db.Column(db.String(100), nullable=False)
    alert_type = db.Column(db.String(50), nullable=False)    # HIGH_TEMPERATURE, LOW_SOIL_MOISTURE, etc.
    severity = db.Column(db.String(20), default='Warning')   # Info, Warning, Critical
    message = db.Column(db.String(255), nullable=False)
    metric_value = db.Column(db.Float, nullable=True)
    threshold_value = db.Column(db.Float, nullable=True)
    is_resolved = db.Column(db.Boolean, default=False)
    resolved_at = db.Column(db.DateTime, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'crop_id': self.crop_id,
            'crop_name': self.crop.name if self.crop else 'General',
            'field_name': self.field_name,
            'alert_type': self.alert_type,
            'severity': self.severity,
            'message': self.message,
            'metric_value': round(self.metric_value, 1) if self.metric_value is not None else None,
            'threshold_value': round(self.threshold_value, 1) if self.threshold_value is not None else None,
            'is_resolved': self.is_resolved,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


class ThresholdSetting(db.Model):
    __tablename__ = 'threshold_settings'

    id = db.Column(db.Integer, primary_key=True)
    metric_name = db.Column(db.String(50), unique=True, nullable=False)
    min_value = db.Column(db.Float, nullable=True)
    max_value = db.Column(db.Float, nullable=True)
    unit = db.Column(db.String(20), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'metric_name': self.metric_name,
            'min_value': self.min_value,
            'max_value': self.max_value,
            'unit': self.unit,
            'description': self.description,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
