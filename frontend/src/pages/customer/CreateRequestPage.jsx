import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldAlert, CheckCircle2, Clock, MapPin, DollarSign, Calendar } from 'lucide-react';
import api from '../../api/client';

const CreateRequestPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedCategory = searchParams.get('category') || '';

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(preselectedCategory);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('San Francisco');
  const [zipCode, setZipCode] = useState('94107');
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [preferredTime, setPreferredTime] = useState('Morning (09:00 - 12:00)');
  const [urgency, setUrgency] = useState('MEDIUM');
  const [budget, setBudget] = useState(150);

  // AI Classification Preview State
  const [aiPreview, setAiPreview] = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data.data))
      .catch(() => {});
  }, []);

  // Trigger AI Classification
  const handleAiClassify = async () => {
    if (!title || !description) {
      setError('Please provide both title and description to run AI classification.');
      return;
    }

    setError('');
    setClassifying(true);

    try {
      const res = await api.post('/ai/classify-request', { title, description });
      const data = res.data.data;
      setAiPreview(data);
      if (data.categoryId && !categoryId) {
        setCategoryId(data.categoryId);
      }
      if (data.urgency) {
        setUrgency(data.urgency);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClassifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        title,
        description,
        categoryId: categoryId || undefined,
        location: { city, zipCode },
        preferredDate,
        preferredTime,
        urgency,
        budget: Number(budget),
      };

      const res = await api.post('/service-requests', payload);
      navigate('/customer/requests');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit service request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 760 }}>
      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.4rem' }}>Post a Service Request</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Our AI engine will classify your needs, extract required skills, and notify verified providers.
          </p>
        </div>

        {error && (
          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Service Request Title</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. AC blows room-temperature air / Kitchen pipe leaking"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description of Problem / Scope</label>
            <textarea
              required
              rows={4}
              className="form-control"
              placeholder="Describe what is happening, model/brand if known, and any special access details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* AI Helper Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={handleAiClassify}
              className="btn btn-secondary btn-sm"
              disabled={classifying || !title || !description}
            >
              <Sparkles size={16} style={{ color: 'var(--primary-600)' }} />
              <span>{classifying ? 'Analyzing with AI...' : 'Analyze with AI Assistant'}</span>
            </button>
          </div>

          {/* AI Results Pill / Card */}
          {aiPreview && (
            <div className="ai-preview-card mb-6">
              <div className="flex-between mb-2">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--primary-700)', fontSize: '0.9rem' }}>
                  <Sparkles size={16} />
                  <span>AI Classification Insights ({Math.round(aiPreview.confidence * 100)}% Confidence)</span>
                </div>
                <span className="ai-pill">{aiPreview.categoryName}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Required Technical Skills Extracted:</strong>{' '}
                {aiPreview.requiredSkills?.join(', ')}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                <strong>Urgency Assessment:</strong> {aiPreview.urgency}
              </div>
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Auto-Detect via AI</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} (${c.basePrice} base)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Service Urgency</label>
              <select
                className="form-control"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
              >
                <option value="LOW">Low (Next couple of weeks)</option>
                <option value="MEDIUM">Medium (Within a few days)</option>
                <option value="HIGH">High (Urgent, within 24-48 hrs)</option>
                <option value="EMERGENCY">Emergency (Immediate)</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="San Francisco"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Zip Code</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="94107"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Preferred Date</label>
              <input
                type="date"
                required
                className="form-control"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Time Window</label>
              <select
                className="form-control"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
              >
                <option value="Morning (09:00 - 12:00)">Morning (09:00 - 12:00)</option>
                <option value="Afternoon (13:00 - 17:00)">Afternoon (13:00 - 17:00)</option>
                <option value="Evening (17:00 - 20:00)">Evening (17:00 - 20:00)</option>
                <option value="Flexible">Flexible Anytime</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Budget ($ USD)</label>
            <input
              type="number"
              min="0"
              className="form-control"
              placeholder="e.g. 150"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={submitting}
          >
            {submitting ? 'Creating Service Request...' : 'Submit Request & Receive Quotes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRequestPage;
