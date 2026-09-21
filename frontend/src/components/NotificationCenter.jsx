import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bell, Check, CheckCheck, MessageSquare, ShieldAlert, ArrowRight } from 'lucide-react';

export const NotificationCenter = ({ onSelectIssue }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.is_read) {
      api.markNotificationRead(n.id).catch(console.error);
    }
    setIsOpen(false);
    if (n.issue_id && onSelectIssue) {
      onSelectIssue(n.issue_id);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-secondary"
        style={{ padding: '0.5rem 0.75rem', position: 'relative' }}
        onClick={() => setIsOpen(!isOpen)}
        title="In-App Notifications"
      >
        <Bell size={16} color={unreadCount > 0 ? '#10b981' : 'var(--text-muted)'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: '#ffffff',
            borderRadius: '9999px',
            fontSize: '0.65rem',
            fontWeight: 800,
            padding: '2px 5px',
            lineHeight: 1
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="glass-panel" style={{
          position: 'absolute',
          right: 0,
          top: '120%',
          width: '340px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
          padding: '1rem',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>Notifications ({unreadCount} new)</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No notifications yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: n.is_read ? 'rgba(0,0,0,0.02)' : 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: n.is_read ? 500 : 700 }}>{n.message}</span>
                    {!n.is_read && (
                      <button onClick={(e) => handleMarkRead(n.id, e)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}>
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{new Date(n.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
