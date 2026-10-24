from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from backend.database import db
from backend.models.models import Crop, SensorReading
from backend.simulator import generate_telemetry_for_crop

sensor_bp = Blueprint('sensor_bp', __name__)

@sensor_bp.route('/latest', methods=['GET'])
def get_latest_readings():
    """
    Returns latest telemetry readings for all active crops with aggregate overview.
    """
    try:
        crops = Crop.query.all()
        results = []
        temps, humidities, moistures, rainfalls = [], [], [], []

        for crop in crops:
            latest = SensorReading.query.filter_by(crop_id=crop.id)                .order_by(SensorReading.timestamp.desc()).first()
            if latest:
                reading_dict = latest.to_dict()
                reading_dict['soil_moisture_threshold'] = crop.soil_moisture_threshold
                reading_dict['needs_irrigation'] = latest.soil_moisture < crop.soil_moisture_threshold
                results.append(reading_dict)
                temps.append(latest.temperature)
                humidities.append(latest.humidity)
                moistures.append(latest.soil_moisture)
                rainfalls.append(latest.rainfall)

        aggregates = {
            'avg_temperature': round(sum(temps) / len(temps), 1) if temps else 0,
            'avg_humidity': round(sum(humidities) / len(humidities), 1) if humidities else 0,
            'avg_soil_moisture': round(sum(moistures) / len(moistures), 1) if moistures else 0,
            'total_rainfall_recent': round(sum(rainfalls), 1) if rainfalls else 0,
            'active_sensors_count': len(results),
            'irrigation_needed_count': sum(1 for r in results if r.get('needs_irrigation'))
        }

        return jsonify({
            'success': True,
            'data': results,
            'summary': aggregates,
            'disclaimer': 'Simulation Mode: Telemetry generated via agricultural environmental model.'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@sensor_bp.route('/history', methods=['GET'])
def get_sensor_history():
    """
    Query historical sensor data with flexible filters (crop_id, timeframe, sensor_type).
    """
    try:
        crop_id = request.args.get('crop_id', type=int)
        timeframe = request.args.get('timeframe', '7d')  # 24h, 7d, 30d, all
        limit = request.args.get('limit', 100, type=int)

        query = SensorReading.query

        if crop_id:
            query = query.filter_by(crop_id=crop_id)

        now = datetime.utcnow()
        if timeframe == '24h':
            query = query.filter(SensorReading.timestamp >= (now - timedelta(hours=24)))
        elif timeframe == '7d':
            query = query.filter(SensorReading.timestamp >= (now - timedelta(days=7)))
        elif timeframe == '30d':
            query = query.filter(SensorReading.timestamp >= (now - timedelta(days=30)))

        readings = query.order_by(SensorReading.timestamp.asc()).limit(limit).all()

        return jsonify({
            'success': True,
            'count': len(readings),
            'data': [r.to_dict() for r in readings]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@sensor_bp.route('/simulate', methods=['POST'])
def trigger_simulation():
    """
    Simulates a new incoming telemetry cycle for all crops or a selected crop.
    """
    try:
        data = request.get_json() or {}
        crop_id = data.get('crop_id')
        force_dry = data.get('force_dry', False)

        generated = []
        if crop_id:
            crop = Crop.query.get(crop_id)
            if crop:
                r = generate_telemetry_for_crop(crop, force_dry=force_dry)
                generated.append(r)
        else:
            crops = Crop.query.all()
            for crop in crops:
                r = generate_telemetry_for_crop(crop, force_dry=force_dry)
                generated.append(r)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Generated simulated telemetry batch ({len(generated)} readings)',
            'data': [r.to_dict() for r in generated],
            'is_simulated': True
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@sensor_bp.route('/reading', methods=['POST'])
def ingest_reading():
    """
    Endpoint for physical IoT gateways (e.g. AWS IoT Core HTTP action or Raspberry Pi)
    or custom telemetry test payloads.
    """
    try:
        data = request.get_json() or {}
        required = ['temperature', 'humidity', 'soil_moisture']
        for field in required:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required metric: {field}'}), 400

        crop_id = data.get('crop_id')
        field_name = data.get('field_name', 'General Field')
        if crop_id:
            crop = Crop.query.get(crop_id)
            if crop:
                field_name = crop.field_name

        reading = SensorReading(
            crop_id=crop_id,
            field_name=field_name,
            temperature=float(data['temperature']),
            humidity=float(data['humidity']),
            soil_moisture=float(data['soil_moisture']),
            rainfall=float(data.get('rainfall', 0.0)),
            battery_level=float(data.get('battery_level', 100.0)),
            is_simulated=bool(data.get('is_simulated', False)),
            status=data.get('status', 'Normal'),
            timestamp=datetime.utcnow()
        )
        db.session.add(reading)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Telemetry reading ingested successfully',
            'data': reading.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
