import os
from dotenv import load_dotenv

# Load .env file from project root
basedir = os.path.abspath(os.path.dirname(__file__))
root_dir = os.path.abspath(os.path.join(basedir, '..'))
load_dotenv(os.path.join(root_dir, '.env'))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-agri-secret-key-change-in-prod')
    DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')
    PORT = int(os.getenv('PORT', 5000))
    
    # Database Configuration: SQLite default for local, RDS PostgreSQL ready
    database_url = os.getenv('DATABASE_URL', f'sqlite:///{os.path.join(basedir, "agriculture.db")}')
    if database_url and database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Simulation settings
    ENABLE_SIMULATED_DATA = os.getenv('ENABLE_SIMULATED_DATA', 'True').lower() in ('true', '1', 't')
    SIMULATION_INTERVAL_SECONDS = int(os.getenv('SIMULATION_INTERVAL_SECONDS', 10))
    
    # AWS Cloud Integration Placeholders
    AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
    ALERT_EMAIL_RECIPIENT = os.getenv('ALERT_EMAIL_RECIPIENT', 'farmer@example.com')
