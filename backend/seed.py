from datetime import datetime, timedelta
import random
from backend.database import db
from backend.models.models import Crop, SensorReading, IrrigationLog, Alert, ThresholdSetting

def seed_database():
    """
    Seeds initial realistic agricultural data for testing and demonstration.
    """
    # Avoid duplicate seeding if crops already exist
    if Crop.query.first():
        print("Database already seeded with crop records.")
        return

    print("Initializing agricultural sample database...")

    # 1. Default Threshold Settings
    thresholds = [
        ThresholdSetting(metric_name='soil_moisture', min_value=30.0, max_value=80.0, unit='%', description='Optimal root zone volumetric water content'),
        ThresholdSetting(metric_name='temperature', min_value=15.0, max_value=35.0, unit='°C', description='Safe ambient crop canopy temperature range'),
        ThresholdSetting(metric_name='humidity', min_value=40.0, max_value=85.0, unit='%', description='Relative atmospheric humidity'),
        ThresholdSetting(metric_name='rainfall', min_value=0.0, max_value=50.0, unit='mm', description='Maximum safe hourly rainfall')
    ]
    db.session.bulk_save_objects(thresholds)

    # 2. Crops across different fields
    crops = [
        Crop(
            name='Wheat - Golden Grain',
            field_name='North Sector A1',
            crop_type='Grain / Cereal',
            planting_date='2026-08-15',
            expected_harvest='2026-12-10',
            soil_moisture_threshold=32.0,
            ideal_temp_min=14.0,
            ideal_temp_max=28.0,
            notes='High-yield durum wheat. Drip and sprinkler compatible.'
        ),
        Crop(
            name='Tomatoes - Roma Organic',
            field_name='Greenhouse 2',
            crop_type='Vegetables',
            planting_date='2026-09-01',
            expected_harvest='2026-11-20',
            soil_moisture_threshold=42.0,
            ideal_temp_min=18.0,
            ideal_temp_max=30.0,
            notes='Sensitive to water stress and blossom end rot. Requires precise moisture.'
        ),
        Crop(
            name='Maize - Sweet Corn Plot',
            field_name='East Valley B4',
            crop_type='Cereal / Corn',
            planting_date='2026-07-20',
            expected_harvest='2026-10-30',
            soil_moisture_threshold=38.0,
            ideal_temp_min=18.0,
            ideal_temp_max=34.0,
            notes='Mid-maturity hybrid maize. Peak tassel formation stage.'
        ),
        Crop(
            name='Almonds & Citrus Grove',
            field_name='South Orchard C1',
            crop_type='Orchard / Fruits',
            planting_date='2025-03-10',
            expected_harvest='2026-11-15',
            soil_moisture_threshold=30.0,
            ideal_temp_min=15.0,
            ideal_temp_max=36.0,
            notes='Deep root zone drip network. Tolerant to brief dry intervals.'
        )
    ]
    db.session.add_all(crops)
    db.session.commit()

    # 3. Generate 7-day Historical Sensor Readings for each crop (every 3 hours)
    now = datetime.utcnow()
    readings = []
    
    for crop in crops:
        current_moisture = crop.soil_moisture_threshold + random.uniform(5.0, 15.0)
        
        for hours_ago in range(168, -1, -3):
            timestamp = now - timedelta(hours=hours_ago)
            hour_of_day = timestamp.hour
            
            # Realistic temperature curve
            temp_variation = 6.0 * ((hour_of_day - 14) / 12.0)
            temperature = round(26.0 + temp_variation + random.uniform(-1.5, 1.5), 1)
            humidity = round(max(25.0, min(92.0, 68.0 - (temperature - 24.0) * 1.8 + random.uniform(-3, 3))), 1)

            # Gradual soil drying
            current_moisture -= random.uniform(0.3, 0.7)

            # Occasional rainfall
            rainfall = 0.0
            if random.random() < 0.08:
                rainfall = round(random.uniform(3.0, 14.0), 1)
                current_moisture += rainfall * 0.7

            # Simulated irrigation replenishment if too dry
            if current_moisture < (crop.soil_moisture_threshold - 6.0):
                current_moisture = crop.soil_moisture_threshold + random.uniform(8.0, 14.0)

            current_moisture = round(max(18.0, min(80.0, current_moisture)), 1)
            
            status = 'Normal'
            if current_moisture < crop.soil_moisture_threshold or temperature > 34.0:
                status = 'Warning'
            if current_moisture < (crop.soil_moisture_threshold - 8.0) or temperature > 37.0:
                status = 'Critical'

            readings.append(SensorReading(
                crop_id=crop.id,
                field_name=crop.field_name,
                temperature=temperature,
                humidity=humidity,
                soil_moisture=current_moisture,
                rainfall=rainfall,
                battery_level=round(random.uniform(92.0, 99.5), 1),
                is_simulated=True,
                status=status,
                timestamp=timestamp
            ))

    db.session.bulk_save_objects(readings)
    db.session.commit()

    # 4. Sample Irrigation Logs
    sample_irrigation = [
        IrrigationLog(
            crop_id=crops[0].id,
            field_name=crops[0].field_name,
            action='PUMP_ON',
            mode='Smart_Automated',
            duration_minutes=25,
            water_volume_liters=450.0,
            soil_moisture_before=27.4,
            soil_moisture_after=41.2,
            status='Completed',
            notes='Automated threshold replenishment triggered by AWS IoT simulated rule.',
            timestamp=now - timedelta(days=2, hours=4)
        ),
        IrrigationLog(
            crop_id=crops[1].id,
            field_name=crops[1].field_name,
            action='PUMP_ON',
            mode='Manual_Simulated',
            duration_minutes=15,
            water_volume_liters=220.0,
            soil_moisture_before=36.1,
            soil_moisture_after=46.5,
            status='Completed',
            notes='Manual simulated spray cycle initiated by greenhouse supervisor.',
            timestamp=now - timedelta(days=1, hours=8)
        ),
        IrrigationLog(
            crop_id=crops[2].id,
            field_name=crops[2].field_name,
            action='PUMP_ON',
            mode='Smart_Automated',
            duration_minutes=35,
            water_volume_liters=680.0,
            soil_moisture_before=31.0,
            soil_moisture_after=44.0,
            status='Completed',
            notes='Night drip irrigation cycle to minimize evaporative loss.',
            timestamp=now - timedelta(hours=14)
        )
    ]
    db.session.add_all(sample_irrigation)

    # 5. Sample Alerts
    sample_alerts = [
        Alert(
            crop_id=crops[1].id,
            field_name=crops[1].field_name,
            alert_type='LOW_SOIL_MOISTURE',
            severity='Warning',
            message=f'Soil moisture in {crops[1].name} dropped below target threshold of {crops[1].soil_moisture_threshold}%.',
            metric_value=37.5,
            threshold_value=crops[1].soil_moisture_threshold,
            is_resolved=True,
            resolved_at=now - timedelta(hours=12),
            timestamp=now - timedelta(hours=18)
        ),
        Alert(
            crop_id=crops[0].id,
            field_name=crops[0].field_name,
            alert_type='HIGH_TEMPERATURE',
            severity='Warning',
            message=f'Afternoon canopy temperature spike in {crops[0].field_name} (36.2°C).',
            metric_value=36.2,
            threshold_value=35.0,
            is_resolved=False,
            timestamp=now - timedelta(hours=3)
        ),
        Alert(
            crop_id=crops[2].id,
            field_name=crops[2].field_name,
            alert_type='HEAVY_RAINFALL',
            severity='Info',
            message=f'Precipitation detected in {crops[2].field_name} (12.4mm). Irrigation schedule postponed.',
            metric_value=12.4,
            threshold_value=10.0,
            is_resolved=False,
            timestamp=now - timedelta(hours=1)
        )
    ]
    db.session.add_all(sample_alerts)
    db.session.commit()
    print("Database seeding successfully completed!")
