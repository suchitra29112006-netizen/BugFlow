import React, { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Plus, Check } from 'lucide-react';
import { api } from '../services/api';

export default function OrgSwitcher({ activeOrg, onSelectOrg, onOpenWizard }) {
  const [isOpen, setIsOpen] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUserOrgs();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUserOrgs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/organizations/user-orgs');
      if (res && res.length > 0) {
        setOrgs(res);
      } else if (activeOrg) {
        setOrgs([activeOrg]);
      }
    } catch (err) {
      console.error("Failed to fetch user organizations:", err);
      if (activeOrg) setOrgs([activeOrg]);
    } finally {
      setLoading(false);
    }
  };

  const currentOrg = activeOrg || (orgs.length > 0 ? orgs[0] : { id: 1, name: 'BugFlow Technologies', plan: 'Enterprise Tier' });
  const displayOrgs = orgs.length > 0 ? orgs : [currentOrg];

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', zIndex: isOpen ? 10000 : 100 }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.45rem 0.85rem',
          borderRadius: '10px',
          background: isOpen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          border: isOpen ? '1px solid #10b981' : '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.95rem',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 12px rgba(16, 185, 129, 0.3)' : 'none'
        }}
      >
        <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
          <Building2 size={16} />
        </div>
        <span>{currentOrg.name}</span>
        <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '290px',
            borderRadius: '12px',
            background: 'var(--bg-secondary, #0f192a)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(16, 185, 129, 0.2)',
            zIndex: 99999,
            padding: '0.65rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            backdropFilter: 'none'
          }}
        >
          <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
            YOUR ORGANIZATIONS
          </div>

          {displayOrgs.map((org) => {
            const isSelected = org.id === currentOrg.id;
            return (
              <button
                key={org.id || org.name}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectOrg(org);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                  background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? '#10b981' : 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontSize: '0.88rem',
                  fontWeight: isSelected ? 700 : 500,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Building2 size={16} style={{ color: isSelected ? '#10b981' : 'var(--text-dim)' }} />
                  <div>
                    <div style={{ lineHeight: 1.2, fontWeight: 700 }}>{org.name}</div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{org.industry || 'Software Engineering'}</span>
                  </div>
                </div>
                {isSelected && <Check size={16} color="#10b981" />}
              </button>
            );
          })}

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.35rem 0' }} />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              if (onOpenWizard) onOpenWizard();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)',
              color: '#10b981',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              width: '100%'
            }}
          >
            <Plus size={16} />
            <span>+ Create New Organization</span>
          </button>
        </div>
      )}
    </div>
  );
}
