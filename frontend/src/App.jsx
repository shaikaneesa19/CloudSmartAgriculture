import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import CropManagement from './pages/CropManagement';
import SensorMonitoring from './pages/SensorMonitoring';
import SmartIrrigation from './pages/SmartIrrigation';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import { api } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchAlertsCount = async () => {
    try {
      const res = await api.getAlerts({ is_resolved: false });
      if (res.summary) {
        setActiveAlertsCount(res.summary.active_total || 0);
      }
    } catch (e) {
      // silent background check
    }
  };

  useEffect(() => {
    fetchAlertsCount();
    const interval = setInterval(fetchAlertsCount, 15000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    await fetchAlertsCount();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleTriggerSimulate = async () => {
    try {
      setIsSimulating(true);
      await api.triggerSimulation();
      setRefreshKey((prev) => prev + 1);
      await fetchAlertsCount();
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Agricultural Telemetry & Analytics Dashboard';
      case 'crops':
        return 'Farm Plot & Crop Management';
      case 'sensors':
        return 'Multi-Zone Environmental Sensor Telemetry';
      case 'irrigation':
        return 'Smart Precision Irrigation Controller';
      case 'alerts':
        return 'Safety Alerts & Threshold Parameters';
      case 'reports':
        return 'Agri-Reports & Historical Telemetry Export';
      default:
        return 'Smart Agriculture Monitoring System';
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        activeAlertsCount={activeAlertsCount}
        isOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="main-wrapper">
        <Topbar
          title={getPageTitle()}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onTriggerSimulate={handleTriggerSimulate}
          isSimulating={isSimulating}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="page-content" key={refreshKey}>
          {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
          {currentPage === 'crops' && <CropManagement />}
          {currentPage === 'sensors' && <SensorMonitoring />}
          {currentPage === 'irrigation' && <SmartIrrigation />}
          {currentPage === 'alerts' && <Alerts />}
          {currentPage === 'reports' && <Reports />}
        </main>
      </div>
    </div>
  );
}
