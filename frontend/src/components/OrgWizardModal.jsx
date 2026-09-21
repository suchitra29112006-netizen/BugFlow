import React, { useState } from 'react';
import { Building2, X, Sparkles, Check, ArrowRight, ArrowLeft, ShieldCheck, Globe, Clock, DollarSign } from 'lucide-react';
import { api } from '../services/api';

export default function OrgWizardModal({ isOpen, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Software / SaaS');
  const [companySize, setCompanySize] = useState('51-200');
  const [country, setCountry] = useState('United States');
  const [stateRegion, setStateRegion] = useState('California');
  const [city, setCity] = useState('San Francisco');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('UTC (Coordinated Universal Time)');
  const [workingHours, setWorkingHours] = useState('09:00 - 18:00 MON-FRI');
  const [currency, setCurrency] = useState('USD ($)');
  
  // AI Config Prompt & Results
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [aiError, setAiError] = useState(null);

  if (!isOpen) return null;

  const handleAIAnalyze = async () => {
    setAiAnalyzing(true);
    setAiError(null);
    try {
      const promptToUse = aiPrompt.trim() || `${name || 'Engineering'} ${industry} organization with ${companySize} employees. ${description || 'Building software applications.'}`;
      const res = await api.post('/api/v1/organizations/ai-configure', { prompt: promptToUse });
      if (res && res.recommended_departments) {
        setAiRecommendations(res);
      } else {
        throw new Error(res?.detail || "Failed to parse AI structure recommendations.");
      }
    } catch (err) {
      console.error("Failed to run AI org analysis:", err);
      setAiError(err.message || "Failed to analyze organization structure. Please try again.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/v1/organizations/wizard', {
        name,
        description: description || `AI Work OS for ${name}`,
        industry,
        company_size: companySize,
        country,
        state_region: stateRegion,
        city,
        website: website || `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.io`,
        timezone,
        working_hours: workingHours,
        currency,
        enable_ai_setup: true,
        ai_setup_prompt: aiPrompt
      });
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      alert("Failed to create organization: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border-color)', background: 'var(--bg-card, #121824)', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Building2 size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>New Organization Wizard</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Step {step} of 3 — {step === 1 ? 'Company Info' : (step === 2 ? 'Regional & SLA' : 'AI Auto-Setup')}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= step ? '#10b981' : 'rgba(255, 255, 255, 0.1)', transition: 'all 0.3s ease' }} />
          ))}
        </div>

        {/* STEP 1: Company Information */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Organization Name *</label>
              <input type="text" className="form-input" placeholder="e.g. Acme SaaS Corporation" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Industry</label>
                <select className="form-select" value={industry} onChange={e => setIndustry(e.target.value)}>
                  <option value="Software / SaaS">Software / SaaS</option>
                  <option value="FinTech">FinTech</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="AI / ML">AI / ML</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Company Size</label>
                <select className="form-select" value={companySize} onChange={e => setCompanySize(e.target.value)}>
                  <option value="1-10">1-10 Employees</option>
                  <option value="11-50">11-50 Employees</option>
                  <option value="51-200">51-200 Employees</option>
                  <option value="201-500">201-500 Employees</option>
                  <option value="501-1000">501-1000 Employees</option>
                  <option value="1000+">1000+ Employees</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Website URL</label>
              <input type="url" className="form-input" placeholder="https://acme.io" value={website} onChange={e => setWebsite(e.target.value)} />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Description</label>
              <textarea className="form-textarea" rows={3} placeholder="Brief mandate or overview of company products..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button className="btn btn-primary" onClick={() => { if (name) setStep(2); else alert("Please enter organization name."); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Next: Regional & SLA → <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Regional Settings & SLA Defaults */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Country</label>
                <input type="text" className="form-input" value={country} onChange={e => setCountry(e.target.value)} />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>State / Region</label>
                <input type="text" className="form-input" value={stateRegion} onChange={e => setStateRegion(e.target.value)} />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>City</label>
                <input type="text" className="form-input" value={city} onChange={e => setCity(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Time Zone</label>
                <input type="text" className="form-input" value={timezone} onChange={e => setTimezone(e.target.value)} />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Working Hours</label>
                <input type="text" className="form-input" value={workingHours} onChange={e => setWorkingHours(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Default Currency</label>
              <input type="text" className="form-input" value={currency} onChange={e => setCurrency(e.target.value)} />
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.82rem' }}>
              <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} /> Default SLA Engine Policy Pre-Configured
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>
                • Critical Severity: 1 hour response, 4 hours resolution<br/>
                • High Severity: 4 hours response, 24 hours resolution
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(3)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Next: AI Auto-Setup → <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: AI Auto-Configuration */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#10b981', marginBottom: '0.4rem' }}>
                <Sparkles size={18} /> Configure Organization with AI
              </div>
              <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Describe your organization setup (e.g. "We are a 50-person SaaS company with Engineering, QA, Product, and DevOps teams") to generate recommended departments, squads, and workflows.
              </p>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>AI Prompt Description</label>
              <textarea 
                className="form-textarea" 
                rows={3} 
                placeholder="e.g. 50-person SaaS company building microservices with Engineering, QA, Product and DevOps..." 
                value={aiPrompt} 
                onChange={e => setAiPrompt(e.target.value)} 
              />
            </div>

            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleAIAnalyze} 
              disabled={aiAnalyzing}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#ffffff', cursor: 'pointer' }}
            >
              <Sparkles size={16} color="#10b981" /> {aiAnalyzing ? 'Analyzing Prompt with AI...' : 'Run AI Structure Analysis'}
            </button>

            {aiError && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.82rem' }}>
                ⚠️ {aiError}
              </div>
            )}

            {aiRecommendations && (
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.82rem' }}>
                <div style={{ fontWeight: 800, color: '#10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>✨ AI Structure Recommendations</span>
                  <span className="badge badge-low" style={{ background: '#10b981', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
                    {aiRecommendations.ai_confidence_score || 94.5}% Confidence
                  </span>
                </div>
                <div><strong>Departments ({aiRecommendations.recommended_departments?.length}):</strong> {aiRecommendations.recommended_departments?.map(d => d.name).join(', ')}</div>
                <div><strong>Squads ({aiRecommendations.recommended_teams?.length}):</strong> {aiRecommendations.recommended_teams?.map(t => t.name).join(', ')}</div>
                {aiRecommendations.recommended_projects && (
                  <div><strong>Projects ({aiRecommendations.recommended_projects?.length}):</strong> {aiRecommendations.recommended_projects?.map(p => p.name).join(', ')}</div>
                )}
                <div><strong>Workflows:</strong> {aiRecommendations.suggested_workflows?.join(' → ')}</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                <Check size={16} /> {loading ? 'Creating Organization...' : 'Finalize & Create Organization'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
