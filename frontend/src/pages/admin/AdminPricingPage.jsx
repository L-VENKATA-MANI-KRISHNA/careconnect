import React, { useEffect, useState } from 'react';
import { DollarSign, Plus, Check } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

const AdminPricingPage = () => {
  const [pricingRules, setPricingRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [ruleType, setRuleType] = useState('PERCENTAGE_FEE');
  const [value, setValue] = useState(10);
  const [minPrice, setMinPrice] = useState(50);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/admin/pricing'),
        api.get('/categories'),
      ]);
      setPricingRules(pRes.data.data || []);
      setCategories(cRes.data.data || []);
      if (cRes.data.data?.length > 0 && !categoryId) {
        setCategoryId(cRes.data.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');

    try {
      await api.post('/admin/pricing', {
        category: categoryId,
        ruleType,
        value: Number(value),
        minimumPrice: Number(minPrice),
        maximumPrice: Number(maxPrice),
      });

      setMsg('Dynamic pricing rule configured successfully');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading platform pricing rules..." />;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Dynamic Pricing & Marketplace Take Rate</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Configure commission percentages, category price floors, and surge rules
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>New Pricing Rule</span>
        </button>
      </div>

      {msg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {msg}
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Rule Type</th>
              <th>Rule Value</th>
              <th>Min Floor</th>
              <th>Max Cap</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pricingRules.map((r) => (
              <tr key={r._id}>
                <td>
                  <strong>{r.category?.name || 'General Category'}</strong>
                </td>
                <td>
                  <span className="badge badge-confirmed">
                    {r.ruleType}
                  </span>
                </td>
                <td>
                  <strong>{r.ruleType === 'PERCENTAGE_FEE' ? `${r.value}% Take Fee` : `$${r.value}`}</strong>
                </td>
                <td>${r.minimumPrice}</td>
                <td>${r.maximumPrice}</td>
                <td>
                  <span className="badge badge-completed">ACTIVE</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Marketplace Pricing Rule"
      >
        <form onSubmit={handleCreateRule}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-control"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Pricing Rule Type</label>
            <select
              className="form-control"
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value)}
            >
              <option value="PERCENTAGE_FEE">PERCENTAGE FEE (%)</option>
              <option value="FLAT_MARKUP">FLAT MARKUP ($)</option>
              <option value="MINIMUM_FLOOR">MINIMUM FLOOR</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Rule Value (% or $)</label>
            <input
              type="number"
              required
              className="form-control"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Min Floor ($)</label>
              <input
                type="number"
                className="form-control"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Cap ($)</label>
              <input
                type="number"
                className="form-control"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Pricing Rule'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPricingPage;
