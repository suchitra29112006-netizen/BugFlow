import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Star, Plus, Trash2, X, Check, Code } from 'lucide-react';

export const EditUserSkillsModal = ({ isOpen, onClose, userId }) => {
  const [catalog, setCatalog] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [proficiency, setProficiency] = useState(3);
  const [yearsExp, setYearsExp] = useState(2.0);
  const [loading, setLoading] = useState(true);

  const fetchSkillData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [skillsList, profileData] = await Promise.all([
        api.listSkillsCatalog(),
        api.getUserProfessionalProfile(userId)
      ]);
      setCatalog(skillsList);
      setUserSkills(profileData.skills || []);
      if (skillsList.length > 0) {
        setSelectedSkillId(skillsList[0].id);
      }
    } catch (err) {
      console.error("Failed to load skill catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchSkillData();
    }
  }, [isOpen, userId]);

  const handleAddExistingSkill = async () => {
    if (!selectedSkillId) return;
    try {
      await api.addSkillToUser(userId, parseInt(selectedSkillId), proficiency, yearsExp);
      fetchSkillData();
    } catch (err) {
      alert("Failed to add skill: " + err.message);
    }
  };

  const handleCreateNewSkillAndAdd = async () => {
    if (!newSkillName.trim()) return;
    try {
      const newSkill = await api.createSkillCatalog(newSkillName.trim(), 'Backend');
      await api.addSkillToUser(userId, newSkill.id, proficiency, yearsExp);
      setNewSkillName('');
      fetchSkillData();
    } catch (err) {
      alert("Failed to create skill: " + err.message);
    }
  };

  const handleRemoveSkill = async (userSkillId) => {
    try {
      await api.removeSkillFromUser(userId, userSkillId);
      fetchSkillData();
    } catch (err) {
      alert("Failed to remove skill: " + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '550px', width: '90%', padding: '2rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Code size={20} color="#10b981" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Manage Technical Skills & Proficiency</h2>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading skills catalog...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Add Skill Form */}
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1.25rem', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'block' }}>
                ADD TECHNICAL SKILL TO USER
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select className="form-select" style={{ flex: 1 }} value={selectedSkillId} onChange={(e) => setSelectedSkillId(e.target.value)}>
                    {catalog.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                    ))}
                  </select>

                  <select className="form-select" style={{ width: '110px' }} value={proficiency} onChange={(e) => setProficiency(parseInt(e.target.value))}>
                    <option value={1}>1 ★ (Beg)</option>
                    <option value={2}>2 ★★ (Mid)</option>
                    <option value={3}>3 ★★★ (Adv)</option>
                    <option value={4}>4 ★★★★ (Exp)</option>
                    <option value={5}>5 ★★★★★ (Master)</option>
                  </select>

                  <button className="btn btn-primary" style={{ padding: '0.4rem 0.85rem' }} onClick={handleAddExistingSkill}>
                    <Plus size={14} /> Add
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Or create new:</span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Custom skill name..."
                    style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                  />
                  <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={handleCreateNewSkillAndAdd}>
                    Create & Add
                  </button>
                </div>
              </div>
            </div>

            {/* Current User Skills List */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                CURRENTLY ASSIGNED SKILLS ({userSkills.length})
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {userSkills.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>No skills added yet.</p>
                ) : (
                  userSkills.map((us) => (
                    <div
                      key={us.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(0,0,0,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <strong style={{ color: '#10b981' }}>{us.name}</strong>
                        <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>
                          {'★'.repeat(us.proficiency_level)}{'☆'.repeat(5 - us.proficiency_level)}
                        </span>
                      </div>

                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: '#ef4444' }}
                        onClick={() => handleRemoveSkill(us.skill_id)}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={onClose}>Close Window</button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
