from flask import Blueprint, request, jsonify
from datetime import datetime
from backend.database import db
from backend.models.models import Crop, SensorReading

crop_bp = Blueprint('crop_bp', __name__)

@crop_bp.route('', methods=['GET'])
def get_crops():
    try:
        crops = Crop.query.all()
        return jsonify({
            'success': True,
            'count': len(crops),
            'data': [crop.to_dict() for crop in crops]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@crop_bp.route('/<int:crop_id>', methods=['GET'])
def get_crop(crop_id):
    try:
        crop = Crop.query.get(crop_id)
        if not crop:
            return jsonify({'success': False, 'error': 'Crop not found'}), 404

        # Fetch recent readings for this crop
        readings = SensorReading.query.filter_by(crop_id=crop_id)            .order_by(SensorReading.timestamp.desc()).limit(20).all()

        crop_data = crop.to_dict()
        crop_data['recent_readings'] = [r.to_dict() for r in readings]

        return jsonify({'success': True, 'data': crop_data}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@crop_bp.route('', methods=['POST'])
def create_crop():
    try:
        data = request.get_json() or {}
        required = ['name', 'field_name', 'planting_date', 'soil_moisture_threshold']
        for field in required:
            if field not in data or data[field] is None:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400

        try:
            moisture_thresh = float(data['soil_moisture_threshold'])
            if not (5.0 <= moisture_thresh <= 90.0):
                return jsonify({'success': False, 'error': 'Moisture threshold must be between 5% and 90%'}), 400
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid moisture threshold numeric value'}), 400

        crop = Crop(
            name=str(data['name']).strip(),
            field_name=str(data['field_name']).strip(),
            crop_type=data.get('crop_type', 'Vegetable'),
            planting_date=str(data['planting_date']),
            expected_harvest=data.get('expected_harvest'),
            soil_moisture_threshold=moisture_thresh,
            ideal_temp_min=float(data.get('ideal_temp_min', 18.0)),
            ideal_temp_max=float(data.get('ideal_temp_max', 32.0)),
            notes=data.get('notes', '')
        )
        db.session.add(crop)
        db.session.commit()

        # Seed an initial reading for the new crop
        from backend.simulator import generate_telemetry_for_crop
        generate_telemetry_for_crop(crop)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Crop record created successfully',
            'data': crop.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@crop_bp.route('/<int:crop_id>', methods=['PUT'])
def update_crop(crop_id):
    try:
        crop = Crop.query.get(crop_id)
        if not crop:
            return jsonify({'success': False, 'error': 'Crop not found'}), 404

        data = request.get_json() or {}
        if 'name' in data:
            crop.name = str(data['name']).strip()
        if 'field_name' in data:
            crop.field_name = str(data['field_name']).strip()
        if 'crop_type' in data:
            crop.crop_type = str(data['crop_type']).strip()
        if 'planting_date' in data:
            crop.planting_date = str(data['planting_date'])
        if 'expected_harvest' in data:
            crop.expected_harvest = str(data['expected_harvest'])
        if 'soil_moisture_threshold' in data:
            crop.soil_moisture_threshold = float(data['soil_moisture_threshold'])
        if 'ideal_temp_min' in data:
            crop.ideal_temp_min = float(data['ideal_temp_min'])
        if 'ideal_temp_max' in data:
            crop.ideal_temp_max = float(data['ideal_temp_max'])
        if 'notes' in data:
            crop.notes = str(data['notes'])

        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Crop record updated successfully',
            'data': crop.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@crop_bp.route('/<int:crop_id>', methods=['DELETE'])
def delete_crop(crop_id):
    try:
        crop = Crop.query.get(crop_id)
        if not crop:
            return jsonify({'success': False, 'error': 'Crop not found'}), 404

        db.session.delete(crop)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Crop "{crop.name}" deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
