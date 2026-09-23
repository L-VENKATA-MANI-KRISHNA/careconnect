import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Check, X, FileText, ExternalLink } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

const AdminProvidersPage = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchProviders = async () => {
    try {
      const res = await api.get('/providers/admin/pending');
      setProviders(res.data.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const openReviewModal = (provider) => {
    setSelectedProvider(provider);
    setVerificationNotes(provider.verificationNotes || '');
    setReviewModalOpen(true);
  };

  const handleVerify = async (status) => {
    setSubmitting(true);
    setActionMsg('');
    try {
      await api.patch(`/providers/admin/verify/${selectedProvider._id}`, {
        status,
        notes: verificationNotes,
      });
      setActionMsg(`Provider ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
      setReviewModalOpen(false);
      fetchProviders();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading pending provider verifications..." />;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Provider Licensing & Verification</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Inspect submitted contractor documents, background details, and approve marketplace providers
          </p>
        </div>
      </div>

      {actionMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {actionMsg}
        </div>
      )}

      {providers.length === 0 ? (
        <EmptyState
          title="No pending provider verifications"
          description="All provider applications have been reviewed. Excellent work!"
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Business / Name</th>
                <th>Contact</th>
                <th>Experience</th>
                <th>Documents</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong>{p.businessName || p.user?.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Owner: {p.user?.name}
                    </div>
                  </td>
                  <td>
                    <div>{p.user?.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {p.user?.phone || 'No phone'}
                    </div>
                  </td>
                  <td>{p.experienceYears} Years</td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                      {p.documents?.length || 0} File(s)
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={p.verificationStatus} />
                  </td>
                  <td>
                    <button
                      onClick={() => openReviewModal(p)}
                      className="btn btn-primary btn-sm"
                    >
                      <ShieldCheck size={16} />
                      <span>Inspect & Verify</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Verification Inspection Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Verify Provider: ${selectedProvider?.businessName || selectedProvider?.user?.name}`}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            <strong>Applicant:</strong> {selectedProvider?.user?.name} ({selectedProvider?.user?.email})
          </div>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            <strong>Experience:</strong> {selectedProvider?.experienceYears} years • Hourly Rate: ${selectedProvider?.hourlyRate}
          </div>
          <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
            <strong>Professional Bio:</strong> {selectedProvider?.bio || 'None provided'}
          </div>

          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
            Submitted Credentials & Licenses ({selectedProvider?.documents?.length || 0})
          </h4>

          {(!selectedProvider?.documents || selectedProvider.documents.length === 0) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No documents attached.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {selectedProvider.documents.map((d, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem 0.85rem',
                    background: '#F8FAFC',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <strong>{d.title}</strong> ({d.documentType})
                  </div>
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--primary-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <span>Inspect</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Verification Audit Notes</label>
            <textarea
              rows={3}
              className="form-control"
              placeholder="e.g. License verified with state contractor licensing board..."
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => handleVerify('APPROVED')}
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={submitting}
            >
              <Check size={18} />
              <span>Approve Provider</span>
            </button>
            <button
              onClick={() => handleVerify('REJECTED')}
              className="btn btn-danger"
              style={{ flex: 1 }}
              disabled={submitting}
            >
              <X size={18} />
              <span>Reject Application</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProvidersPage;
