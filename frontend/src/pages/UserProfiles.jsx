import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, Star, Award, Code, CheckCircle2, AlertCircle, Clock, Briefcase, Plus, Edit3, ShieldCheck } from 'lucide-react';
import { DeveloperProfileModal } from '../components/DeveloperProfileModal';
import { EditUserSkillsModal } from '../components/EditUserSkillsModal';

export const UserProfiles = () => {
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);

  const fetchUsersAndProfiles = async () => {
    setLoading(true);
    try {
      const userList = await api.getUsers();
      setUsers(userList);

      const profileMap = {};
      await Promise.all(
        userList.map(async (u) => {
          try {
            const profData = await api.getUserProfessionalProfile(u.id);
            profileMap[u.id] = profData;
          } catch (e) {
            console.error(`Failed to fetch profile for user ${u.id}:`, e);
          }
        })
      );
      setProfiles(profileMap);
    } catch (err) {
      console.error("Failed to load user profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndProfiles();
  }, []);

  const renderStarRating = (level) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={12}
          fill={i <= level ? '#f59e0b' : 'none'}
          color={i <= level ? '#f59e0b' : 'var(--text-dim)'}
          style={{ marginRight: '1px' }}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Developer Profiles...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-low" style={{ background: '#10b981', color: '#fff', fontWeight: 800 }}>
              TEAM INTELLIGENCE SUITE
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>User & Developer Intelligence Profiles</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Detailed skill proficiencies, historical resolution metrics, project experience, and workload capacity.
          </p>
        </div>
      </div>

      {/* User Profile Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {users.map((u) => {
          const prof = profiles[u.id] || {};
          const metrics = prof.metrics || {};
          const skills = prof.skills || [];

          return (
            <div key={u.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              
              <div>
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{u.name}</h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</span>
                  </div>
                  <span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span>
                </div>

                {/* Qualification & Experience */}
                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Experience:</span>
                    <strong style={{ color: '#10b981' }}>{prof.profile?.years_experience || 3.5} Yrs ({prof.profile?.experience_level || 'Mid-level'})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Specialization:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{prof.profile?.specialization || 'Full Stack'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Availability:</span>
                    <strong style={{ color: prof.profile?.availability_status === 'Available' ? '#10b981' : '#f97316' }}>
                      {prof.profile?.availability_status || 'Available'}
                    </strong>
                  </div>
                </div>

                {/* Skills with Star Rating */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TECHNICAL SKILLS</span>
                    <button
                      style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 700 }}
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setIsSkillModalOpen(true);
                      }}
                    >
                      + Manage Skills
                    </button>
                  </div>

                  {skills.length === 0 ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>No skills added yet.</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {skills.map((s) => (
                        <div key={s.id} style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, color: '#10b981' }}>{s.name}</span>
                          <span style={{ display: 'flex', alignItems: 'center' }}>{renderStarRating(s.proficiency_level)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Metrics Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.5rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>RESOLVED</span>
                    <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>{metrics.resolved_issues || 0}</strong>
                  </div>

                  <div style={{ background: 'rgba(249, 115, 22, 0.08)', padding: '0.5rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>ACTIVE</span>
                    <strong style={{ fontSize: '1.1rem', color: '#f97316' }}>{metrics.active_issues || 0}</strong>
                  </div>

                  <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '0.5rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>CAPACITY</span>
                    <strong style={{ fontSize: '1.1rem', color: '#3b82f6' }}>{metrics.capacity_percentage || 100}%</strong>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.4rem', fontSize: '0.78rem', justifyContent: 'center' }}
                  onClick={() => {
                    setSelectedUserId(u.id);
                    setIsProfileModalOpen(true);
                  }}
                >
                  <Edit3 size={13} /> Edit Profile
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Developer Profile Modal */}
      <DeveloperProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          fetchUsersAndProfiles();
        }}
        userId={selectedUserId}
      />

      {/* Edit User Skills Modal */}
      <EditUserSkillsModal
        isOpen={isSkillModalOpen}
        onClose={() => {
          setIsSkillModalOpen(false);
          fetchUsersAndProfiles();
        }}
        userId={selectedUserId}
      />

    </div>
  );
};
