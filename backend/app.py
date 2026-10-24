import os
import sys
import threading
import time
from flask import Flask, jsonify
from flask_cors import CORS

# Add root directory to sys.path so 'backend.*' imports resolve cleanly
basedir = os.path.abspath(os.path.dirname(__file__))
root_dir = os.path.abspath(os.path.join(basedir, '..'))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.config import Config
from backend.database import db
from backend.routes import register_blueprints
from backend.seed import seed_database
from backend.models.models import Crop
from backend.simulator import generate_telemetry_for_crop

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for all cross-origin frontend requests
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize SQLAlchemy
    db.init_app(app)

    # Register all modular route blueprints
    register_blueprints(app)

    # Base & Health Check Route
    @app.route('/api/health', methods=['GET'])
    def health_check():
        db_status = "Connected"
        crop_count = 0
        try:
            crop_count = Crop.query.count()
        except Exception as e:
            db_status = f"Error: {str(e)}"

        return jsonify({
            'status': 'healthy',
            'service': 'Cloud-Based Smart Agriculture Backend',
            'version': '1.0.0',
            'database': {
                'type': 'SQLite (Local) / RDS Ready',
                'status': db_status,
                'crops_monitored': crop_count
            },
            'simulation_mode': app.config.get('ENABLE_SIMULATED_DATA', True),
            'cloud_provider_target': 'AWS (EC2 / Elastic Beanstalk / S3)',
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }), 200

    @app.route('/', methods=['GET'])
    def index():
        return jsonify({
            'name': 'Cloud-Based Smart Agriculture Monitoring System API',
            'status': 'Online',
            'documentation': {
                'health': '/api/health',
                'crops': '/api/crops',
                'sensors_latest': '/api/sensors/latest',
                'sensors_history': '/api/sensors/history',
                'sensors_simulate': '/api/sensors/simulate (POST)',
                'irrigation_status': '/api/irrigation/status',
                'irrigation_simulate': '/api/irrigation/simulate (POST)',
                'irrigation_logs': '/api/irrigation/logs',
                'alerts': '/api/alerts',
                'alerts_thresholds': '/api/alerts/thresholds',
                'reports_summary': '/api/reports/summary',
                'reports_export_csv': '/api/reports/export/csv'
            }
        }), 200

    # Auto-initialize database schema and demo seed data on startup
    with app.app_context():
        try:
            db.create_all()
            seed_database()
        except Exception as e:
            print(f"Database initialization notice: {e}")

    return app

# Background daemon simulator thread
def run_background_simulator(app):
    with app.app_context():
        interval = app.config.get('SIMULATION_INTERVAL_SECONDS', 15)
        print(f"Background sensor simulator active (interval: {interval}s).")
        while True:
            time.sleep(interval)
            try:
                crops = Crop.query.all()
                if crops:
                    for crop in crops:
                        generate_telemetry_for_crop(crop)
                    db.session.commit()
            except Exception as e:
                db.session.rollback()

app = create_app()

if __name__ == '__main__':
    # Launch background simulator in daemon thread if enabled
    if app.config.get('ENABLE_SIMULATED_DATA', True) and os.getenv('RUN_MAIN') != 'true':
        sim_thread = threading.Thread(target=run_background_simulator, args=(app,), daemon=True)
        sim_thread.start()

    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')
    print(f"Starting Smart Agriculture Monitoring System Backend on port {port} (Debug: {debug})...")
    app.run(host='0.0.0.0', port=port, debug=debug)
