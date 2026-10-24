import random
from datetime import datetime
from backend.database import db
from backend.models.models import Crop, SensorReading, Alert, ThresholdSetting

def generate_telemetry_for_crop(crop, force_dry=False):
    """
    Generates realistic, physically-sound simulated agricultural telemetry.
    """
    # Base temperature with small random walk
    base_temp = 26.0
    hour = datetime.utcnow().hour
    # Daytime warmer than nighttime
    diurnal_temp = 4.0 * ((hour - 12) / 12.0)
    temp_noise = random.uniform(-1.5, 1.8)
    temperature = max(12.0, min(42.0, base_temp + diurnal_temp + temp_noise))

    # Humidity is inversely related to temperature + random variation
    base_humidity = 65.0 - (temperature - 25.0) * 1.5
    humidity = max(20.0, min(95.0, base_humidity + random.uniform(-4.0, 4.0)))

    # Soil moisture: check last reading or initialize
    latest = SensorReading.query.filter_by(crop_id=crop.id).order_by(SensorReading.timestamp.desc()).first()
    if force_dry:
        soil_moisture = max(15.0, crop.soil_moisture_threshold - random.uniform(8.0, 15.0))
    elif latest:
        # Natural soil moisture depletion (0.2% - 0.8% per step unless it rained or irrigated)
        drying_rate = random.uniform(0.1, 0.4)
        soil_moisture = max(18.0, min(85.0, latest.soil_moisture - drying_rate))
    else:
        # Default around threshold + 5%
        soil_moisture = round(crop.soil_moisture_threshold + random.uniform(2.0, 10.0), 1)

    # Rainfall (rare event: 10% chance of showers, otherwise 0.0)
    rainfall_chance = random.random()
    if rainfall_chance < 0.12:
        rainfall = round(random.uniform(2.0, 18.0), 1)
        # Rain increases soil moisture
        soil_moisture = min(90.0, soil_moisture + (rainfall * 0.8))
    else:
        rainfall = 0.0

    battery_level = round(max(75.0, 99.0 - random.uniform(0, 5.0)), 1)

    # Determine status
    status = 'Normal'
    if soil_moisture < (crop.soil_moisture_threshold - 8.0) or temperature > 36.0:
        status = 'Critical'
    elif soil_moisture < crop.soil_moisture_threshold or temperature > 32.0 or temperature < 15.0:
        status = 'Warning'

    reading = SensorReading(
        crop_id=crop.id,
        field_name=crop.field_name,
        temperature=round(temperature, 1),
        humidity=round(humidity, 1),
        soil_moisture=round(soil_moisture, 1),
        rainfall=rainfall,
        battery_level=battery_level,
        is_simulated=True,
        status=status,
        timestamp=datetime.utcnow()
    )
    db.session.add(reading)

    # Check alert conditions
    check_and_trigger_alerts(crop, reading)

    return reading

def check_and_trigger_alerts(crop, reading):
    """
    Checks reading against thresholds and records alerts if not already active.
    """
    # Temperature alert check
    if reading.temperature > 35.0:
        existing = Alert.query.filter_by(
            crop_id=crop.id, 
            alert_type='HIGH_TEMPERATURE', 
            is_resolved=False
        ).first()
        if not existing:
            alert = Alert(
                crop_id=crop.id,
                field_name=crop.field_name,
                alert_type='HIGH_TEMPERATURE',
                severity='Critical' if reading.temperature > 38.0 else 'Warning',
                message=f'High temperature detected in {crop.name} ({reading.temperature}°C). Exceeds safe limit (35°C).',
                metric_value=reading.temperature,
                threshold_value=35.0,
                timestamp=datetime.utcnow()
            )
            db.session.add(alert)
    elif reading.temperature < 12.0:
        existing = Alert.query.filter_by(
            crop_id=crop.id, 
            alert_type='LOW_TEMPERATURE', 
            is_resolved=False
        ).first()
        if not existing:
            alert = Alert(
                crop_id=crop.id,
                field_name=crop.field_name,
                alert_type='LOW_TEMPERATURE',
                severity='Warning',
                message=f'Low frost-risk temperature detected in {crop.name} ({reading.temperature}°C).',
                metric_value=reading.temperature,
                threshold_value=12.0,
                timestamp=datetime.utcnow()
            )
            db.session.add(alert)

    # Soil moisture check
    if reading.soil_moisture < crop.soil_moisture_threshold:
        severity = 'Critical' if reading.soil_moisture < (crop.soil_moisture_threshold - 10.0) else 'Warning'
        existing = Alert.query.filter_by(
            crop_id=crop.id, 
            alert_type='LOW_SOIL_MOISTURE', 
            is_resolved=False
        ).first()
        if not existing:
            alert = Alert(
                crop_id=crop.id,
                field_name=crop.field_name,
                alert_type='LOW_SOIL_MOISTURE',
                severity=severity,
                message=f'Low soil moisture in {crop.name}: {reading.soil_moisture}% (Threshold: {crop.soil_moisture_threshold}%). Irrigation recommended.',
                metric_value=reading.soil_moisture,
                threshold_value=crop.soil_moisture_threshold,
                timestamp=datetime.utcnow()
            )
            db.session.add(alert)

    # Heavy rainfall
    if reading.rainfall > 15.0:
        alert = Alert(
            crop_id=crop.id,
            field_name=crop.field_name,
            alert_type='HEAVY_RAINFALL',
            severity='Info',
            message=f'Heavy rainfall recorded in {crop.field_name}: {reading.rainfall}mm. Irrigation paused.',
            metric_value=reading.rainfall,
            threshold_value=15.0,
            timestamp=datetime.utcnow()
        )
        db.session.add(alert)
