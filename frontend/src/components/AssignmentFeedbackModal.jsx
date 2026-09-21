import React, { useState } from 'react';
import { api } from '../services/api';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';

export const AssignmentFeedbackModal = ({ isOpen, onClose, issueId }) => {
  const [isGood, setIsGood] = useState(true);
  const [reasonCategory, setReasonCategory] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitAssignmentFeedback(issueId, {
        is_good_recommendation: isGood,
        reason_category: reasonCategory || undefined,
        comments: comments.trim() || undefined
      });
      onClose();
    } catch (err) {
      alert("Failed to submit feedback: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '500px', width: '90%', padding: '1.75rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Evaluate AI Assignment Accuracy</h3>
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              className={`btn ${isGood ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '0.75rem', justifyContent: 'center' }}
              onClick={() => setIsGood(true)}
            >
              <ThumbsUp size={16} /> 👍 Good Recommendation
            </button>
            <button
              type="button"
              className={`btn ${!isGood ? 'btn-danger' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '0.75rem', justifyContent: 'center' }}
              onClick={() => setIsGood(false)}
            >
              <ThumbsDown size={16} /> 👎 Poor Recommendation
            </button>
          </div>

          {!isGood && (
            <div className="form-group">
              <label>Reason Category</label>
              <select className="form-select" value={reasonCategory} onChange={(e) => setReasonCategory(e.target.value)} required>
                <option value="">Select reason...</option>
                <option value="Incorrect skill match">Incorrect skill match</option>
                <option value="Incorrect technology match">Incorrect technology match</option>
                <option value="Workload was underestimated">Workload was underestimated</option>
                <option value="Similar issue experience was inaccurate">Similar issue experience was inaccurate</option>
                <option value="Availability was inaccurate">Availability was inaccurate</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Additional Notes / Feedback (Optional)</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Provide constructive feedback for assignment analytics..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
