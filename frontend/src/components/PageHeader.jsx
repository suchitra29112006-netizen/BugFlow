import React from 'react';
import { ChevronRight } from 'lucide-react';

export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions = null,
  tabs = null,
  activeTab = null,
  onTabChange = null
}) => {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      
      {/* Breadcrumbs Row */}
      {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && (
        <nav className="breadcrumb">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            const label = typeof crumb === 'string' ? crumb : (crumb?.label || '');
            const onClick = typeof crumb === 'object' ? crumb?.onClick : null;

            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight size={12} color="var(--text-dim)" />}
                <span 
                  className={`breadcrumb-item ${isLast ? 'active' : ''}`}
                  style={{ cursor: onClick ? 'pointer' : 'default' }}
                  onClick={onClick ? onClick : undefined}
                >
                  {label}
                </span>
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Controls */}
        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs Row */}
      {Array.isArray(tabs) && tabs.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', marginTop: '1rem', paddingBottom: '0.4rem', flexWrap: 'wrap' }}>
          {tabs.map((tab, idx) => {
            const key = typeof tab === 'string' ? tab : (tab.key || tab.id || tab.label || idx);
            const label = typeof tab === 'string' ? tab : tab.label;
            const count = typeof tab === 'object' ? tab.count : undefined;
            const isActive = activeTab === key;

            return (
              <button
                key={key}
                className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                onClick={() => onTabChange && onTabChange(key)}
              >
                {label} {count !== undefined && `(${count})`}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
};
