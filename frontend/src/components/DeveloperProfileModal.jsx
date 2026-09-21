import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, Award, Plus, Trash2, X, Check, ShieldCheck, Code, Cpu } from 'lucide-react';

export const DeveloperProfileModal = ({ isOpen, onClose, userId }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form States
  const [yearsExp, setYearsExp] = useState(1.0);
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [availability, setAvailability] = useState('AVAILABLE');
  const [maxCap, setMaxCap] = useState(5);
  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(3);
  const [techs, setTechs] = useState([]);
  const [newTech, setNewTech] = useState('');

  const fetchProfile = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await api.getDeveloperProfile(userId);
      setProfile(data);
      setYearsExp(data.years_experience || 1.0);
      setSpecialization(data.primary_specialization || 'Full Stack');
      setQualification(data.qualification || 'B.Tech CS');
      setAvailability(data.availability_status || 'AVAILABLE');
      setMaxCap(data.max_capacity || 5);
      setSkills(data.skills || []);
      setTechs(data.technologies || []);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills(prev => [...prev, { skill_name: newSkillName.trim(), proficiency_level: newSkillLevel, category: 'Technical' }]);
    setNewSkillName('');
  };

  const handleRemoveSkill = (index) => {
    setSkills(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTech = () => {
    if (!newTech.trim()) return;
    setTechs(prev => [...prev, newTech.trim()]);
    setNewTech('');
  };

  const handleRemoveTech = (index) => {
    setTechs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateDeveloperProfile(userId, {
        years_experience: parseFloat(yearsExp),
        primary_specialization: specialization,
        qualification: qualification,
        availability_status: availability,
        max_capacity: parseInt(maxCap),
        skills: skills.map(s => ({ skill_name: s.skill_name, proficiency_level: s.proficiency_level, category: s.category || 'Backend' })),
        technologies: techs
      });
      onClose();
    } catch (err) {
      alert("Failed to save profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '650px', width: '90%', padding: '2rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="#10b981" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Developer Profile & Skill Intelligence</h2>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading developer profile...</div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Years of Experience</label>
                <input type="number" step="0.5" className="form-input" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Primary Specialization</label>
                <input type="text" className="form-input" value={specialization} onChange={(e) => setSpecialization(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Availability Status</label>
                <select className="form-select" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                  <option value="AVAILABLE">Available for Work</option>
                  <option value="BUSY">Busy (High Load)</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </div>

              <div className="form-group">
                <label>Max Active Issue Capacity</label>
                <input type="number" className="form-input" value={maxCap} onChange={(e) => setMaxCap(e.target.value)} required />
              </div>
            </div>

            {/* Technical Skills & Proficiency (1-5) */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                <Code size={14} color="#10b981" /> Technical Skills & Proficiency (1=Beginner, 5=Expert)
              </label>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. FastAPI, Python, React"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                />
                <select className="form-select" style={{ width: '110px' }} value={newSkillLevel} onChange={(e) => setNewSkillLevel(parseInt(e.target.value))}>
                  <option value={1}>1 (Beg)</option>
                  <option value={2}>2 (Mid)</option>
                  <option value={3}>3 (Adv)</option>
                  <option value={4}>4 (Expert)</option>
                  <option value={5}>5 (Master)</option>
                </select>
                <button type="button" className="btn btn-secondary" onClick={handleAddSkill}>
                  <Plus size={14} /> Add
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {skills.map((s, idx) => (
                  <span key={idx} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                    {s.skill_name} ({s.proficiency_level}/5)
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveSkill(idx)} />
                  </span>
                ))}
              </div>
            </div>

            {/* Technologies */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                <Cpu size={14} color="#3b82f6" /> Preferred Technologies / Frameworks
              </label>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. PostgreSQL, Redis, Docker"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                />
                <button type="button" className="btn btn-secondary" onClick={handleAddTech}>
                  <Plus size={14} /> Add
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {techs.map((t, idx) => (
                  <span key={idx} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                    {t}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTech(idx)} />
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving Profile...' : 'Save Developer Profile'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};
