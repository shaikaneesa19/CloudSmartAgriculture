# Cloud-Based Smart Agriculture Monitoring System 🌾☁️

An enterprise-grade, cloud-ready full-stack precision agriculture monitoring platform built with **React.js**, **Chart.js**, **Python Flask**, and **SQLAlchemy**. The system delivers real-time environmental telemetry monitoring, automated smart irrigation recommendations, crop lifecycle management, and anomaly alerts.

---

## 🌟 Key Features

### 1. Telemetry & Analytics Dashboard
- **Key Metrics**: Real-time canopy temperature (°C), atmospheric humidity (%), soil moisture (%), and rainfall (mm).
- **Interactive Visualizations**: Dynamic 24-hour multi-channel environmental curves and crop moisture deficit charts powered by Chart.js.
- **Crop Health Matrix**: Live status indicators (Optimal, Caution, Warning, Critical) across all agricultural parcels.
- **Quick Action Dispatch**: One-click simulated irrigation cycle dispatch directly from the dashboard.

### 2. Multi-Zone Sensor Monitoring
- **Data Model**: Captures temperature, humidity, volumetric soil moisture, precipitation, and battery telemetry.
- **Simulation Engine**: Realistic biological and meteorological mathematical simulation engine (diurnal solar heating, natural evapotranspiration, rain events).
- **Clear Demarcation**: Explicit visual labels identifying simulated demonstration telemetry versus physical hardware feeds.
- **Custom Ingestion**: Support for manual packet injection to test IoT gateway integration payloads.

### 3. Smart Precision Irrigation
- **Deficit Calculation**: Algorithms evaluate soil moisture against crop-specific thresholds, incorporating recent precipitation to prevent overwatering.
- **Simulation Controls**: Interactive valve state simulation (PUMP_ON / PUMP_OFF) with configurable duration and water volume estimation.
- **Hardware Actuation Disclaimer**: Explicitly framed as a software simulation demonstration without claims of direct electrical relay control.
- **Audit Logs**: Historical record of all irrigation events including before/after moisture replenishment percentages.

### 4. Alert & Threshold Management
- **Automated Detection**: Real-time alerts for high canopy heat stress (>35°C), frost hazards (<12°C), low root zone moisture, and heavy rainfall.
- **Configurable Limits**: In-app threshold configuration table allowing farmers to adjust warning and critical limits.
- **Alert Resolution**: Individual or batch resolution workflows with persistent audit status.

### 5. Crop & Parcel Management
- Full CRUD operations (Add, View, Edit, Delete) for crops and field sectors.
- Configurable minimum soil moisture thresholds and ideal temperature bands per crop variety.
- Automatic initial telemetry generation when new parcel plots are provisioned.

### 6. Agronomic Reports & CSV Export
- Historical analytics filtered by time window (24 Hours, 7 Days, 30 Days, All Time) and specific crop plots.
- Summary statistics including min/max/average distribution and cumulative irrigation water volume.
- **Direct CSV Telemetry Export**: One-click download of all raw historical readings formatted with timestamps and field tags.

---

## 🏗️ Cloud & System Architecture

```mermaid
graph TD
    subgraph Frontend ["Frontend Tier (Client / AWS S3 + CloudFront)"]
        UI[React.js Single Page App]
        Charts[Chart.js Visualizations]
        UI --> Charts
    end

    subgraph Backend ["Application Tier (Flask / AWS EC2 or Elastic Beanstalk)"]
        API[Flask REST API Service]
        Sim[Agricultural Simulator Daemon]
        Routes[Modular Blueprints]
        API --> Routes
        Sim --> Routes
    end

    subgraph DataTier ["Data Tier (SQLite Local / Amazon RDS Production)"]
        DB[(Database: SQLite / PostgreSQL RDS)]
    end

    subgraph IoTIngestion ["Future IoT Ingestion Tier (AWS IoT Core)"]
        Sensors[ESP32 / Raspberry Pi Sensors]
        IoTCore[AWS IoT Core MQTT Broker]
        Lambda[AWS Lambda Ingestion Worker]
        Sensors -->|MQTT over TLS| IoTCore
        IoTCore -->|Rule Engine| Lambda
        Lambda -->|POST /api/sensors/reading| API
    end

    UI -->|REST API Calls (JSON)| API
    Routes -->|SQLAlchemy ORM| DB
```

---

## 📂 Project Organization

```
CloudSmartAgriculture/
├── backend/
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py            # SQLAlchemy models (Crop, SensorReading, IrrigationLog, Alert, Threshold)
│   ├── routes/
│   │   ├── __init__.py          # Blueprint registry
│   │   ├── alert_routes.py      # Alerts & threshold configuration endpoints
│   │   ├── crop_routes.py       # Crop CRUD endpoints
│   │   ├── irrigation_routes.py # Smart irrigation recommendation & simulation endpoints
│   │   ├── report_routes.py     # Summary statistics & CSV streaming export endpoints
│   │   └── sensor_routes.py     # Real-time telemetry feed & simulation endpoints
│   ├── app.py                   # Flask application entry point with CORS & background worker
│   ├── config.py                # Environment configuration & RDS connection logic
│   ├── database.py              # SQLAlchemy database instance
│   ├── Procfile                 # AWS Elastic Beanstalk WSGI specification
│   ├── requirements.txt         # Python dependencies
│   ├── seed.py                  # Realistic agricultural demo seed data
│   ├── simulator.py             # Telemetry mathematical simulation engine
│   └── wsgi.py                  # Production WSGI entry point
├── frontend/
│   ├── public/                  # Static assets & favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── MetricCard.jsx   # Top-level KPI card with trend & status indicators
│   │   │   ├── Modal.jsx        # Accessible dialog component
│   │   │   ├── SensorChart.jsx  # Chart.js line & bar wrapper
│   │   │   ├── Sidebar.jsx      # Navigation drawer with green & white theme
│   │   │   ├── SimulatedBanner.jsx # Simulation disclaimer and AWS architecture details
│   │   │   └── Topbar.jsx       # Header bar with simulation trigger & refresh buttons
│   │   ├── pages/
│   │   │   ├── Alerts.jsx       # Alerts feed & configurable threshold editor
│   │   │   ├── CropManagement.jsx # Crop plot directory with CRUD modals
│   │   │   ├── Dashboard.jsx    # Primary telemetry overview & active status matrix
│   │   │   ├── Reports.jsx      # Historical analytics & CSV export
│   │   │   ├── SensorMonitoring.jsx # Real-time sensor stream with simulation controls
│   │   │   └── SmartIrrigation.jsx # Deficit recommendation engine & simulated pump actuation
│   │   ├── services/
│   │   │   └── api.js           # Centralized Fetch API client
│   │   ├── App.jsx              # Main application shell & tab routing
│   │   ├── index.css            # AgriCloud modern green/white design tokens & styles
│   │   └── main.jsx             # React DOM root entry
│   ├── index.html               # Responsive HTML5 template with Google typography
│   ├── package.json             # Frontend dependencies & Vite scripts
│   └── vite.config.js           # Vite dev server with /api proxy to backend
├── .env.example                 # Example environment variables
├── .gitignore                   # Exclusions for virtualenvs, node_modules, and databases
├── package.json                 # Top-level management scripts
└── README.md                    # Project documentation
```

---

## 💻 Local Setup & Execution Guide

Follow these steps to run both the backend and frontend on your local machine using **Windows PowerShell**.

### Prerequisites
- **Python 3.10+** (with virtual environment support)
- **Node.js v18+** & **npm**

---

### Step 1: Backend Setup & Execution (Terminal 1)

Open your first Windows PowerShell terminal in the project directory:

```powershell
# 1. Navigate to the project root
cd c:\Users\shaik\Documents\CloudSmartAgriculture

# 2. Activate the Python virtual environment
.\venv\Scripts\Activate.ps1

# (Optional: If activating scripts is restricted in your PowerShell session, run:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)

# 3. Verify or install backend dependencies
pip install -r backend/requirements.txt

# 4. Start the Flask Backend Server
python backend/app.py
```

The backend server will automatically:
- Create the local SQLite database schema (`agriculture.db`).
- Populate realistic initial crops, historical sensor telemetry, irrigation logs, and alerts.
- Start the REST API on `http://127.0.0.1:5000` with the background simulation worker active.

---

### Step 2: Frontend Setup & Execution (Terminal 2)

Open a **second** Windows PowerShell terminal:

```powershell
# 1. Navigate to the project frontend directory
cd c:\Users\shaik\Documents\CloudSmartAgriculture\frontend

# 2. Install dependencies (if not already installed)
npm install

# 3. Start the Vite development server
npm run dev
```

The frontend will be available at:
👉 **`http://localhost:3000`** (or port specified in terminal).

Requests to `/api/*` are automatically proxied to `http://127.0.0.1:5000`.

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | System health check, database status, and cloud configuration |
| `/api/crops` | `GET` | List all crop plots with current health & irrigation status |
| `/api/crops` | `POST` | Create a new crop parcel plot |
| `/api/crops/<id>` | `PUT` | Update crop name, field, or moisture threshold |
| `/api/crops/<id>` | `DELETE` | Remove crop plot and associated telemetry |
| `/api/sensors/latest` | `GET` | Latest telemetry packets for each plot with aggregate averages |
| `/api/sensors/history` | `GET` | Historical telemetry filterable by `crop_id`, `timeframe`, and `limit` |
| `/api/sensors/simulate` | `POST` | Generate new simulated telemetry cycle across all or selected crops |
| `/api/sensors/reading` | `POST` | Ingest physical or custom telemetry payload (IoT gateway ready) |
| `/api/irrigation/status`| `GET` | Algorithmic irrigation deficit recommendations per crop |
| `/api/irrigation/simulate` | `POST` | Simulate turning pump ON/OFF (updates moisture & creates audit log) |
| `/api/irrigation/logs` | `GET` | Historical log of irrigation events with water volumes & moisture change |
| `/api/alerts` | `GET` | List active or resolved alerts filterable by severity and status |
| `/api/alerts/<id>/resolve` | `PUT` | Mark a specific alert as resolved |
| `/api/alerts/resolve-all` | `POST` | Batch resolve all active warnings |
| `/api/alerts/thresholds` | `GET` | Get configurable metric boundary thresholds |
| `/api/alerts/thresholds/<id>` | `PUT` | Update min/max threshold values |
| `/api/reports/summary` | `GET` | Aggregated statistical report over 24h, 7d, 30d, or all-time |
| `/api/reports/export/csv` | `GET` | Stream and download sensor telemetry dataset as `.csv` file |

---

## ☁️ AWS Cloud Deployment Guide

The application is engineered with an AWS cloud-native target architecture.

### 1. Backend on AWS Elastic Beanstalk or Amazon EC2

#### Deploying with Elastic Beanstalk:
1. Initialize the Elastic Beanstalk application using the AWS CLI or Console:
   ```bash
   eb init -p python-3.11 smart-agriculture-api --region us-east-1
   eb create smart-agriculture-prod-env
   ```
2. The included `backend/Procfile` instructs AWS Elastic Beanstalk to launch Gunicorn:
   ```
   web: gunicorn --bind 0.0.0.0:5000 backend.wsgi:app
   ```
3. Set environment variables in the Elastic Beanstalk Configuration:
   - `DATABASE_URL`: `postgresql://<user>:<password>@<rds-endpoint>:5432/smart_agriculture`
   - `SECRET_KEY`: `<your-production-secret-key>`
   - `ENABLE_SIMULATED_DATA`: `False` (for production with real sensors) or `True` (for cloud demo)

#### Deploying on Amazon EC2:
1. Launch an Amazon Linux 2023 or Ubuntu EC2 instance in a public subnet.
2. Install Python 3 and Git, clone the repository, and set up a Systemd service running Gunicorn behind an Nginx reverse proxy.
3. Configure the EC2 Security Group to allow inbound HTTP/HTTPS traffic on ports 80/443.

---

### 2. Frontend Static Hosting on Amazon S3 + Amazon CloudFront

1. **Build the production bundle**:
   ```powershell
   cd frontend
   npm run build
   ```
   This generates optimized static HTML, CSS, and JS assets inside `frontend/dist/`.

2. **Create and Configure the S3 Bucket**:
   ```bash
   aws s3 mb s3://smart-agri-dashboard-static --region us-east-1
   aws s3 sync dist/ s3://smart-agri-dashboard-static --delete
   ```
3. **Enable Static Website Hosting** in S3 bucket properties with `index.html` as the index and error document.
4. **Distribute with Amazon CloudFront**:
   - Create a CloudFront distribution pointing to the S3 website origin.
   - Configure HTTPS with a free SSL certificate from AWS Certificate Manager (ACM).
   - Configure CloudFront behaviors to route `/api/*` requests directly to the Elastic Beanstalk or EC2 load balancer.

---

### 3. Replacing SQLite with Amazon RDS for Production

To transition from local SQLite to a highly available, multi-AZ relational database on AWS:

1. Provision an **Amazon RDS for PostgreSQL** or **MySQL** instance.
2. Place the RDS instance in private subnets with a Security Group allowing port 5432 only from the EC2 / Elastic Beanstalk security group.
3. Update the `DATABASE_URL` environment variable:
   ```ini
   DATABASE_URL=postgresql://dbadmin:SuperSecurePassword123!@smart-agri-db.cxyz.us-east-1.rds.amazonaws.com:5432/smart_agriculture
   ```
4. SQLAlchemy automatically handles the dialect change without requiring code modifications.

---

### 4. Future Integration with AWS IoT Core for Physical Agricultural Sensors

To connect real-world soil probes and weather stations:

```
[ Farm Sensors (DHT22, Soil Capacitive, Rain Gauge) ]
                          │
                          ▼
            [ ESP32 / LoRaWAN Node ]
                          │  (MQTT over TLS 1.3 / Port 8883)
                          ▼
               [ AWS IoT Core Broker ]
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
   [ IoT Rule Engine ]            [ Device Shadow ]
         │                        (Desired/Reported valve state)
         ▼
   [ AWS Lambda Worker ]
         │ (POST /api/sensors/reading)
         ▼
  [ Flask Backend REST API ]
```

1. **Device Provisioning**: Each field node (e.g., ESP32 with solar charging) is registered as an AWS IoT "Thing" with an X.509 client certificate and private key.
2. **Telemetry Ingestion**: Devices publish JSON telemetry to MQTT topic:
   ```
   agriculture/field/plot_A1/telemetry
   ```
   **Payload Format**:
   ```json
   {
     "crop_id": 1,
     "field_name": "North Sector A1",
     "temperature": 27.4,
     "humidity": 64.2,
     "soil_moisture": 31.8,
     "rainfall": 0.0,
     "battery_level": 98.5
   }
   ```
3. **IoT Rule Action**: An AWS IoT Core Rule invokes an AWS Lambda function or sends an HTTP POST request directly to the Flask backend's `/api/sensors/reading` endpoint to persist the physical reading.
4. **Device Shadows**: Valve actuators subscribe to delta topics (`$aws/things/valve_01/shadow/update/delta`) to receive irrigation ON/OFF commands when thresholds trigger.

---

## 🔒 Security & Best Practices

- **Zero Hardcoded Secrets**: Secrets and database credentials are managed exclusively via environment variables (`.env`).
- **Input Validation**: Backend endpoints validate sensor bounds, data types, and required fields.
- **Defensive Error Handling**: Database transactions employ explicit rollbacks on error.
- **Git Hygiene**: Virtual environments, Node modules, databases, and local `.env` files are excluded via `.gitignore`.
- **Honest Simulation Transparency**: UI banners explicitly clarify that demonstration mode runs on mathematical models rather than live field actuators.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
