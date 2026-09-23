import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  CheckCircle,
  Truck,
  Play,
  Upload,
  Clock,
  MapPin,
  FileCheck,
  AlertCircle,
  Phone,
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

const ProviderJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);

  // Evidence upload modal
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidenceType, setEvidenceType] = useState('BEFORE');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);

  const [submittingAction, setSubmittingAction] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchJobs = async () => {
    try {
      const res = await api.get('/bookings');
      setJobs(res.data.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const openJobDetails = async (job) => {
    setSelectedJob(job);
    try {
      const res = await api.get(`/bookings/${job._id}`);
      setEvidenceList(res.data.data.evidence || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (jobId, newStatus) => {
    setErrorMsg('');
    setSubmittingAction(true);
    try {
      await api.patch(`/bookings/${jobId}/status`, { status: newStatus });
      setMsg(`Job status updated to ${newStatus.replace(/_/g, ' ')}`);
      await fetchJobs();
      if (selectedJob?._id === jobId) {
        setSelectedJob((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update job status');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceFile) {
      setErrorMsg('Please select an evidence image or document file');
      return;
    }

    setErrorMsg('');
    setSubmittingAction(true);

    try {
      const formData = new FormData();
      formData.append('type', evidenceType);
      formData.append('description', evidenceDesc);
      formData.append('file', evidenceFile);

      await api.post(`/bookings/${selectedJob._id}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMsg('Evidence photo uploaded successfully!');
      setEvidenceModalOpen(false);
      setEvidenceFile(null);
      setEvidenceDesc('');

      // Refresh evidence
      const res = await api.get(`/bookings/${selectedJob._id}`);
      setEvidenceList(res.data.data.evidence || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload evidence');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading assigned jobs..." />;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Active Jobs & Evidence</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Manage ongoing jobs, update real-time progress, and upload photo evidence for customer sign-off
          </p>
        </div>
      </div>

      {msg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {msg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {errorMsg}
        </div>
      )}

      {jobs.length === 0 ? (
        <EmptyState
          title="No jobs currently assigned"
          description="When customers accept your quotes, confirmed bookings will appear here."
        />
      ) : (
        <div className="grid-2">
          {/* Jobs List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {jobs.map((j) => (
              <div
                key={j._id}
                className="card"
                style={{
                  cursor: 'pointer',
                  border: selectedJob?._id === j._id ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                }}
                onClick={() => openJobDetails(j)}
              >
                <div className="flex-between mb-2">
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    JOB #{j._id.slice(-6).toUpperCase()}
                  </span>
                  <StatusBadge status={j.status} />
                </div>

                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>
                  {j.serviceRequest?.title || 'Service Job'}
                </h3>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Customer: <strong>{j.customer?.name}</strong> • Phone: {j.customer?.phone || 'On file'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <span>{j.scheduledDate} ({j.startTime} - {j.endTime})</span>
                  <strong style={{ color: 'var(--primary-700)', fontSize: '1.1rem' }}>
                    ${j.quote?.amount || 0}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          {/* Job Operations Panel */}
          <div>
            {selectedJob ? (
              <div className="card">
                <div className="flex-between mb-4">
                  <div>
                    <h3 style={{ fontSize: '1.25rem' }}>Job Execution Controls</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      #{selectedJob._id.slice(-6).toUpperCase()} • {selectedJob.scheduledDate}
                    </div>
                  </div>
                  <StatusBadge status={selectedJob.status} />
                </div>

                {/* Progress Advancement Actions */}
                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                    Advance Job Status:
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedJob.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedJob._id, 'PROVIDER_ON_THE_WAY')}
                        className="btn btn-primary btn-sm"
                        disabled={submittingAction}
                      >
                        <Truck size={16} />
                        <span>I Am On The Way</span>
                      </button>
                    )}

                    {selectedJob.status === 'PROVIDER_ON_THE_WAY' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedJob._id, 'IN_PROGRESS')}
                        className="btn btn-primary btn-sm"
                        disabled={submittingAction}
                      >
                        <Play size={16} />
                        <span>Start Work (In Progress)</span>
                      </button>
                    )}

                    {selectedJob.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedJob._id, 'COMPLETED_PENDING_CONFIRMATION')}
                        className="btn btn-primary btn-sm"
                        disabled={submittingAction}
                      >
                        <CheckCircle size={16} />
                        <span>Mark Completed (Ready for Sign-Off)</span>
                      </button>
                    )}

                    {selectedJob.status === 'COMPLETED_PENDING_CONFIRMATION' && (
                      <div style={{ color: 'var(--accent-amber)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={16} />
                        <span>Waiting for Customer to Confirm Completion</span>
                      </div>
                    )}

                    {selectedJob.status === 'COMPLETED' && (
                      <div style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle size={16} />
                        <span>Job Fully Completed & Confirmed!</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Contact & Address */}
                <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Address:</strong> {selectedJob.address?.street}, {selectedJob.address?.city}, {selectedJob.address?.zipCode}
                  </div>
                  <div>
                    <strong>Customer Contact:</strong> {selectedJob.customer?.name} ({selectedJob.customer?.phone || 'No phone'})
                  </div>
                </div>

                {/* Evidence Section */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="flex-between mb-3">
                    <h4 style={{ fontSize: '1rem' }}>Job Evidence ({evidenceList.length})</h4>
                    <button
                      onClick={() => setEvidenceModalOpen(true)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Upload size={16} />
                      <span>Upload Photo Evidence</span>
                    </button>
                  </div>

                  {evidenceList.length === 0 ? (
                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No photos uploaded yet. Upload before and after photos to demonstrate job quality.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                      {evidenceList.map((ev) => (
                        <div key={ev._id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem', background: '#FFFFFF' }}>
                          <span className="badge badge-available" style={{ fontSize: '0.7rem', marginBottom: '0.35rem' }}>
                            {ev.type}
                          </span>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            {ev.description || 'Job photo'}
                          </div>
                          <a
                            href={ev.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--primary-600)', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            View File ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                Select a job from the left to view job details, update progress, and upload evidence photos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Evidence Upload Modal */}
      <Modal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        title="Upload Job Evidence"
      >
        <form onSubmit={handleUploadEvidence}>
          <div className="form-group">
            <label className="form-label">Evidence Stage Type</label>
            <select
              className="form-control"
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
            >
              <option value="BEFORE">BEFORE (Initial inspection / pre-repair)</option>
              <option value="DURING">DURING (Disassembly / parts replacement)</option>
              <option value="AFTER">AFTER (Clean finished work)</option>
              <option value="DOCUMENT">DOCUMENT (Warranty / receipt / specs)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Work Notes</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Replaced leaking valve and pressurized line"
              value={evidenceDesc}
              onChange={(e) => setEvidenceDesc(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Image or Document File</label>
            <input
              type="file"
              required
              accept="image/*,.pdf,.doc,.docx"
              className="form-control"
              onChange={(e) => setEvidenceFile(e.target.files[0])}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={submittingAction}
          >
            {submittingAction ? 'Uploading Evidence...' : 'Upload Evidence'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ProviderJobsPage;
