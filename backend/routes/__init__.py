from .crop_routes import crop_bp
from .sensor_routes import sensor_bp
from .irrigation_routes import irrigation_bp
from .alert_routes import alert_bp
from .report_routes import report_bp

def register_blueprints(app):
    app.register_blueprint(crop_bp, url_prefix='/api/crops')
    app.register_blueprint(sensor_bp, url_prefix='/api/sensors')
    app.register_blueprint(irrigation_bp, url_prefix='/api/irrigation')
    app.register_blueprint(alert_bp, url_prefix='/api/alerts')
    app.register_blueprint(report_bp, url_prefix='/api/reports')
