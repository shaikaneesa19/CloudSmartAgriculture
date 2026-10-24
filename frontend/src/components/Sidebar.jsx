import React from 'react';
import {
  LayoutDashboard,
  Sprout,
  Activity,
  Droplets,
  AlertTriangle,
  BarChart3,
  Cloud,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar({
  currentPage,
  onNavigate,
  activeAlertsCount = 0,
  isOpen = false,
  onCloseMobile,
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'crops', label: 'Crop Management', icon: Sprout },
    { id: 'sensors', label: 'Sensor Monitoring', icon: Activity },
    { id: 'irrigation', label: 'Smart Irrigation', icon: Droplets },
    {
      id: 'alerts',
      label: 'Alerts & Limits',
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? activeAlertsCount : null,
      badgeType: 'danger',
    },
    { id: 'reports', label: 'Reports & History', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 45,
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon-wrapper">
            <Sprout size={22} />
          </div>
          <div className="brand-text">
            <h1>AgriCloud</h1>
            <span>Precision Ag IoT</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <a
                key={item.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge ${item.badgeType || ''}`}>
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.7 }} />
                )}
              </a>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="cloud-pill" style={{ marginBottom: '0.65rem' }}>
            <div className="cloud-dot" />
            <Cloud size={14} style={{ color: '#0284c7' }} />
            <span>AWS-Ready Arch</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: '#64748b' }}>
            <ShieldCheck size={14} style={{ color: '#10b981' }} />
            <span>Telemetry Verified (Sim)</span>
          </div>
        </div>
      </aside>
    </>
  );
}
