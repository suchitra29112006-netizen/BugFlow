import React from 'react';
import { QrCode, X, Smartphone, Check } from 'lucide-react';

export const QRCodeModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Use a reliable QR Code generator image URL for instant scanning
  const currentUrl = window.location.origin + '/#mobile-report';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}&color=10b981&bgcolor=ffffff`;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '0.4rem', borderRadius: '8px' }}>
              <QrCode size={18} color="#fff" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>QR Code Mobile Reporting</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Scan this QR Code with your smartphone camera to report bugs directly from your mobile device.
        </p>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', display: 'inline-block', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginBottom: '1.25rem' }}>
          <img src={qrImageUrl} alt="BugFlow Mobile QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
          <Smartphone size={16} /> Instant Mobile Triage Sync
        </div>

        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>
            Close QR Window
          </button>
        </div>
      </div>
    </div>
  );
};
