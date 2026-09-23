import React, { useEffect, useState } from 'react';
import { Tag, Plus, Check, Trash2, Edit2 } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Category modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(60);
  const [requiredSkillsStr, setRequiredSkillsStr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?all=true');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setActionMsg('');

    try {
      const skills = requiredSkillsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await api.post('/categories', {
        name,
        description,
        basePrice: Number(basePrice),
        requiredSkills: skills,
      });

      setActionMsg(`Category '${name}' created successfully`);
      setModalOpen(false);
      setName('');
      setDescription('');
      setRequiredSkillsStr('');
      fetchCategories();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      await api.patch(`/categories/${cat._id}`, { isActive: !cat.isActive });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner message="Loading marketplace categories..." />;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Service Domains & Skills Taxonomy</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Configure active service marketplace categories, base pricing floors, and required technical skills
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>Add New Category</span>
        </button>
      </div>

      {actionMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {actionMsg}
        </div>
      )}

      <div className="grid-3">
        {categories.map((c) => (
          <div key={c._id} className="card">
            <div className="flex-between mb-2">
              <h3 style={{ fontSize: '1.25rem' }}>{c.name}</h3>
              <span className={`badge ${c.isActive ? 'badge-completed' : 'badge-cancelled'}`}>
                {c.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', minHeight: 40 }}>
              {c.description}
            </p>

            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.35rem' }}>
                REQUIRED SKILLS:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {c.requiredSkills?.map((s, idx) => (
                  <span key={idx} style={{ background: '#F1F5F9', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex-between" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Base Price: </span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--primary-700)' }}>${c.basePrice}</strong>
              </div>
              <button
                onClick={() => handleToggleActive(c)}
                className={`btn btn-sm ${c.isActive ? 'btn-secondary' : 'btn-primary'}`}
              >
                {c.isActive ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Service Category"
      >
        <form onSubmit={handleCreateCategory}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Solar Panel Maintenance"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={3}
              required
              className="form-control"
              placeholder="Scope of work and typical jobs handled in this category..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Base Starting Price ($ USD)</label>
            <input
              type="number"
              required
              min="10"
              className="form-control"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Required Skills (Comma separated)</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Inverter Diagnostics, Wiring, Panel Cleaning"
              value={requiredSkillsStr}
              onChange={(e) => setRequiredSkillsStr(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={submitting}
          >
            {submitting ? 'Creating Category...' : 'Save & Publish Category'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCategoriesPage;
