import React from 'react';
import { Menu, RefreshCw, Zap, Radio } from 'lucide-react';

export default function Topbar({
  title,
  onRefresh,
  isRefreshing = false,
  onTriggerSimulate,
  isSimulating = false,
  onToggleMobileMenu,
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          onClick={onToggleMobileMenu}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dark)',
          }}
          className="mobile-menu-btn"
        >
          <Menu size={22} />
        </button>
        <div>
          <h2 className="topbar-title">{title}</h2>
        </div>
      </div>

      <div className="topbar-right">
        <div className="sim-banner-pill">
          <Radio size={14} className="animate-pulse" style={{ color: '#2563eb' }} />
          <span>Simulated Feed Active</span>
        </div>

        {onTriggerSimulate && (
          <button
            className="btn btn-primary btn-sm"
            onClick={onTriggerSimulate}
            disabled={isSimulating}
            title="Generate new simulated environmental readings across all farm sectors"
          >
            <Zap size={14} className={isSimulating ? 'spin-anim' : ''} />
            <span>{isSimulating ? 'Simulating...' : 'Simulate Pulse'}</span>
          </button>
        )}

        {onRefresh && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh current telemetry & data"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        @media (max-width: 900px) {
          .mobile-menu-btn {
            display: inline-flex !important;
          }
          .sim-banner-pill span {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
