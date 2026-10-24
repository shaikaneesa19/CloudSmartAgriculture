from flask import Blueprint, request, jsonify
from datetime import datetime
from backend.database import db
from backend.models.models import Alert, ThresholdSetting, Crop

alert_bp = Blueprint('alert_bp', __name__)

@alert_bp.route('', methods=['GET'])
def get_alerts():
    """
    Returns alerts filtered by status, severity, crop, or limit.
    """
    try:
        is_resolved_param = request.args.get('is_resolved')
        severity = request.args.get('severity')
        crop_id = request.args.get('crop_id', type=int)
        limit = request.args.get('limit', 50, type=int)

        query = Alert.query

        if is_resolved_param is not None:
            is_resolved = is_resolved_param.lower() in ('true', '1')
            query = query.filter_by(is_resolved=is_resolved)

        if severity:
            query = query.filter_by(severity=severity.capitalize())

        if crop_id:
            query = query.filter_by(crop_id=crop_id)

        alerts = query.order_by(Alert.timestamp.desc()).limit(limit).all()

        # Count active alerts
        active_critical = Alert.query.filter_by(is_resolved=False, severity='Critical').count()
        active_warning = Alert.query.filter_by(is_resolved=False, severity='Warning').count()
        active_total = Alert.query.filter_by(is_resolved=False).count()

        return jsonify({
            'success': True,
            'count': len(alerts),
            'summary': {
                'active_total': active_total,
                'active_critical': active_critical,
                'active_warning': active_warning
            },
            'data': [a.to_dict() for a in alerts]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@alert_bp.route('/<int:alert_id>/resolve', methods=['PUT'])
def resolve_alert(alert_id):
    """
    Marks a specific alert as resolved.
    """
    try:
        alert = Alert.query.get(alert_id)
        if not alert:
            return jsonify({'success': False, 'error': 'Alert not found'}), 404

        alert.is_resolved = True
        alert.resolved_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Alert marked as resolved',
            'data': alert.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@alert_bp.route('/resolve-all', methods=['POST'])
def resolve_all_alerts():
    """
    Marks all currently active alerts as resolved.
    """
    try:
        now = datetime.utcnow()
        unresolved = Alert.query.filter_by(is_resolved=False).all()
        for a in unresolved:
            a.is_resolved = True
            a.resolved_at = now
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Resolved {len(unresolved)} active alerts.'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@alert_bp.route('/thresholds', methods=['GET'])
def get_thresholds():
    """
    Returns configurable environmental monitoring thresholds.
    """
    try:
        settings = ThresholdSetting.query.all()
        return jsonify({
            'success': True,
            'count': len(settings),
            'data': [s.to_dict() for s in settings]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@alert_bp.route('/thresholds/<int:setting_id>', methods=['PUT'])
def update_threshold(setting_id):
    """
    Updates warning/critical threshold parameters.
    """
    try:
        setting = ThresholdSetting.query.get(setting_id)
        if not setting:
            return jsonify({'success': False, 'error': 'Threshold setting not found'}), 404

        data = request.get_json() or {}
        if 'min_value' in data and data['min_value'] is not None:
            setting.min_value = float(data['min_value'])
        if 'max_value' in data and data['max_value'] is not None:
            setting.max_value = float(data['max_value'])
        if 'description' in data:
            setting.description = str(data['description'])

        setting.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Threshold for {setting.metric_name} updated successfully',
            'data': setting.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
