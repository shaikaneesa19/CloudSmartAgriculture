from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from backend.database import db
from backend.models.models import Crop, SensorReading, IrrigationLog, Alert

irrigation_bp = Blueprint('irrigation_bp', __name__)

@irrigation_bp.route('/status', methods=['GET'])
def get_irrigation_status():
    """
    Computes smart irrigation recommendations for each crop based on
    current soil moisture, crop thresholds, and recent rainfall patterns.
    """
    try:
        crops = Crop.query.all()
        recommendations = []
        overall_pumps_active = 0

        for crop in crops:
            latest_reading = SensorReading.query.filter_by(crop_id=crop.id)\
                .order_by(SensorReading.timestamp.desc()).first()

            current_moisture = latest_reading.soil_moisture if latest_reading else 45.0
            recent_rain = latest_reading.rainfall if latest_reading else 0.0

            # Calculate moisture deficit
            threshold = crop.soil_moisture_threshold
            deficit = threshold - current_moisture

            # Check if irrigation is recommended
            # If recent rainfall is high (> 8mm), hold off irrigation
            if recent_rain >= 8.0:
                is_recommended = False
                urgency = 'Rain Delay'
                reason = f'Recent precipitation ({recent_rain}mm) sufficient. Irrigation suppressed to conserve water.'
                rec_duration = 0
                est_water = 0
            elif deficit > 10.0:
                is_recommended = True
                urgency = 'Critical'
                reason = f'Severe soil moisture deficit ({current_moisture}% vs target {threshold}%). Urgent watering required.'
                rec_duration = 30
                est_water = 450.0
            elif deficit > 0:
                is_recommended = True
                urgency = 'Moderate'
                reason = f'Soil moisture below threshold ({current_moisture}% vs {threshold}%). Scheduled top-up recommended.'
                rec_duration = 15
                est_water = 220.0
            elif current_moisture > 75.0:
                is_recommended = False
                urgency = 'Oversaturated'
                reason = f'Soil moisture very high ({current_moisture}%). Risk of root asphyxiation if watered.'
                rec_duration = 0
                est_water = 0
            else:
                is_recommended = False
                urgency = 'Optimal'
                reason = f'Soil moisture at healthy level ({current_moisture}%). Target: {threshold}%.'
                rec_duration = 0
                est_water = 0

            # Last irrigation action
            last_log = IrrigationLog.query.filter_by(crop_id=crop.id)\
                .order_by(IrrigationLog.timestamp.desc()).first()

            recommendations.append({
                'crop_id': crop.id,
                'crop_name': crop.name,
                'field_name': crop.field_name,
                'current_moisture': current_moisture,
                'threshold': threshold,
                'deficit': round(deficit, 1),
                'is_recommended': is_recommended,
                'urgency': urgency,
                'reason': reason,
                'recommended_duration_mins': rec_duration,
                'estimated_water_liters': est_water,
                'last_irrigated': last_log.timestamp.isoformat() if last_log and last_log.timestamp else None,
                'last_action': last_log.action if last_log else 'None'
            })

        return jsonify({
            'success': True,
            'data': recommendations,
            'summary': {
                'total_crops': len(crops),
                'needing_irrigation': sum(1 for r in recommendations if r['is_recommended']),
                'critical_count': sum(1 for r in recommendations if r['urgency'] == 'Critical')
            },
            'disclaimer': 'Smart irrigation recommendations are generated via algorithmic threshold evaluation. Real-world valve hardware actuation is simulated in this software.'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@irrigation_bp.route('/simulate', methods=['POST'])
def simulate_irrigation():
    """
    Simulates turning an irrigation valve/pump ON or OFF.
    Updates telemetry (replenishing soil moisture) and creates an audit log.
    NOTE: Simulated environment - does NOT actuate physical hardware.
    """
    try:
        data = request.get_json() or {}
        crop_id = data.get('crop_id')
        action = data.get('action', 'PUMP_ON').upper() # PUMP_ON, PUMP_OFF, CYCLE
        duration_minutes = int(data.get('duration_minutes', 20))
        water_liters = float(data.get('water_volume_liters', duration_minutes * 15.0))
        notes = data.get('notes', 'Manual simulated irrigation command from Web UI')

        crop = None
        field_name = 'General Field'
        if crop_id:
            crop = Crop.query.get(crop_id)
            if not crop:
                return jsonify({'success': False, 'error': f'Crop with id {crop_id} not found'}), 404
            field_name = crop.field_name

        # Find latest reading to compute before/after moisture
        latest_reading = None
        if crop:
            latest_reading = SensorReading.query.filter_by(crop_id=crop.id)\
                .order_by(SensorReading.timestamp.desc()).first()

        moisture_before = latest_reading.soil_moisture if latest_reading else 30.0

        if action in ('PUMP_ON', 'START', 'CYCLE'):
            # Replenish soil moisture (increase by 12% to 22%, capped at 85%)
            gain = round(min(25.0, (duration_minutes * 0.8) + 8.0), 1)
            moisture_after = round(min(85.0, moisture_before + gain), 1)

            # Log the irrigation event
            log = IrrigationLog(
                crop_id=crop.id if crop else None,
                field_name=field_name,
                action='PUMP_ON',
                mode='Manual_Simulated',
                duration_minutes=duration_minutes,
                water_volume_liters=water_liters,
                soil_moisture_before=moisture_before,
                soil_moisture_after=moisture_after,
                status='Completed',
                notes=f'{notes}. Simulated soil moisture replenished from {moisture_before}% to {moisture_after}%.',
                timestamp=datetime.utcnow()
            )
            db.session.add(log)

            # Inject updated sensor reading reflecting the irrigation
            if crop:
                new_reading = SensorReading(
                    crop_id=crop.id,
                    field_name=crop.field_name,
                    temperature=latest_reading.temperature if latest_reading else 24.5,
                    humidity=min(95.0, (latest_reading.humidity if latest_reading else 60.0) + 10.0),
                    soil_moisture=moisture_after,
                    rainfall=0.0,
                    battery_level=latest_reading.battery_level if latest_reading else 98.0,
                    is_simulated=True,
                    status='Normal',
                    timestamp=datetime.utcnow()
                )
                db.session.add(new_reading)

                # Auto-resolve LOW_SOIL_MOISTURE alert if active
                active_alert = Alert.query.filter_by(
                    crop_id=crop.id,
                    alert_type='LOW_SOIL_MOISTURE',
                    is_resolved=False
                ).first()
                if active_alert and moisture_after >= crop.soil_moisture_threshold:
                    active_alert.is_resolved = True
                    active_alert.resolved_at = datetime.utcnow()

            db.session.commit()

            return jsonify({
                'success': True,
                'message': f'Simulated irrigation cycle started and completed for {field_name}.',
                'action': 'PUMP_ON',
                'is_simulated': True,
                'details': {
                    'duration_minutes': duration_minutes,
                    'water_volume_liters': water_liters,
                    'soil_moisture_before': moisture_before,
                    'soil_moisture_after': moisture_after,
                    'log_id': log.id
                },
                'disclaimer': 'SIMULATED DEMO: Real irrigation pumps are NOT physically connected or controlled.'
            }), 200

        else: # PUMP_OFF / STOP
            log = IrrigationLog(
                crop_id=crop.id if crop else None,
                field_name=field_name,
                action='PUMP_OFF',
                mode='Manual_Simulated',
                duration_minutes=0,
                water_volume_liters=0.0,
                soil_moisture_before=moisture_before,
                soil_moisture_after=moisture_before,
                status='Stopped',
                notes=f'{notes}. Pump manually shut off.',
                timestamp=datetime.utcnow()
            )
            db.session.add(log)
            db.session.commit()

            return jsonify({
                'success': True,
                'message': f'Simulated irrigation pump stopped for {field_name}.',
                'action': 'PUMP_OFF',
                'is_simulated': True,
                'disclaimer': 'SIMULATED DEMO: Hardware valve state simulated.'
            }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@irrigation_bp.route('/logs', methods=['GET'])
def get_irrigation_logs():
    """
    Retrieves historical irrigation events and simulation audit logs.
    """
    try:
        limit = request.args.get('limit', 50, type=int)
        crop_id = request.args.get('crop_id', type=int)

        query = IrrigationLog.query
        if crop_id:
            query = query.filter_by(crop_id=crop_id)

        logs = query.order_by(IrrigationLog.timestamp.desc()).limit(limit).all()

        return jsonify({
            'success': True,
            'count': len(logs),
            'data': [log.to_dict() for log in logs]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
