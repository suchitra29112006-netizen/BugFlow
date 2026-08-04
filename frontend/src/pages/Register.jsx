import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bug, User, Mail, Lock, UserCheck, ArrowRight } from 'lucide-react';

export const Register = ({ onSwitchToLogin }) => {
  const { register, login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Reporter');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ name, email, password, role });
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top left, rgba(168, 85, 247, 0.15), transparent 40%), var(--bg-primary)', padding: '1.5rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', width: '50px', height: '50px', borderRadius: '14px', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 8px 20px rgba(168, 85, 247, 0.4)' }}>
            <Bug size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Create BugFlow Account</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Join your team workspace</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Jane Developer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <User size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group">
            <label>Team Role</label>
            <div style={{ position: 'relative' }}>
              <select className="form-select" style={{ paddingLeft: '2.5rem' }} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Reporter">Reporter (Reports bugs & tracks progress)</option>
                <option value="QA">QA Tester (Validates & verifies fixes)</option>
                <option value="Developer">Developer (Fixes defects & updates code)</option>
                <option value="Admin">Admin (Full administrative privileges)</option>
              </select>
              <UserCheck size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.8rem' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Account'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 700, cursor: 'pointer' }}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
