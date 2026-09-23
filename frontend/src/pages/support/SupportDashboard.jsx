import React, { useEffect, useState } from 'react';
import { Headphones, AlertTriangle, Check, UserCheck, ShieldCheck, DollarSign } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

const SupportDashboard = () => {
  const [data, setData] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dispute resolution modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchDashboard = async () => {
    try {
      const [dashRes, dispRes] = await Promise.all([
        api.get('/support/dashboard-summary'),
        api.get('/disputes'),
      ]);
      setData(dashRes.data.data);
      setDisputes(dispRes.data.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleAssignToMe = async (disputeId) => {
    try {
      await api.patch(`/disputes/${disputeId}/assign`);
      setMsg('Dispute assigned to your support queue');
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const openResolveModal = (dispute) => {
    setSelectedDispute(dispute);
    setResolutionNotes('');
    setRefundAmount(0);
    setModalOpen(true);
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');

    try {
      await api.post(`/disputes/${selectedDispute._id}/resolve`, {
        status: resolutionStatus,
        resolution: resolutionNotes,
        refundAmount: Number(refundAmount),
      });

      setMsg(`Dispute marked as ${resolutionStatus}`);
      setModalOpen(false);
      fetchDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading customer support center..." />;

  const { metrics } = data || {};

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Support & Dispute Resolution</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Investigate customer complaints, inspect evidence, resolve tickets, and authorize refunds
          </p>
        </div>
      </div>

      {msg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {msg}
        </div>
      )}

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: 'var(--accent-rose)', background: '#FFF1F2' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-value">{metrics?.openDisputes || 0}</div>
            <div className="stat-label">Open Disputes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: 'var(--accent-amber)', background: '#FEF3C7' }}>
            <Headphones size={24} />
          </div>
          <div>
            <div className="stat-value">{metrics?.underReviewDisputes || 0}</div>
            <div className="stat-label">Under Investigation</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ color: 'var(--accent-emerald)', background: '#ECFDF5' }}>
            <Check size={24} />
          </div>
          <div>
            <div className="stat-value">{metrics?.resolvedDisputes || 0}</div>
            <div className="stat-label">Resolved Tickets</div>
          </div>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Active Support Tickets</h3>

        {disputes.length === 0 ? (
          <EmptyState
            title="No support tickets found"
            description="All customer disputes have been processed and resolved."
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket / Date</th>
                  <th>Raised By</th>
                  <th>Reason</th>
                  <th>Assigned Agent</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <strong>#{d._id.slice(-6).toUpperCase()}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(d.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div>{d.raisedBy?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {d.raisedBy?.email}
                      </div>
                    </td>
                    <td>
                      <strong>{d.reason}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.description}
                      </div>
                    </td>
                    <td>
                      {d.assignedAgent ? (
                        <span>{d.assignedAgent.name}</span>
                      ) : (
                        <button
                          onClick={() => handleAssignToMe(d._id)}
                          className="btn btn-secondary btn-sm"
                        >
                          <UserCheck size={14} />
                          <span>Assign to Me</span>
                        </button>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td>
                      {d.status !== 'RESOLVED' && d.status !== 'REJECTED' ? (
                        <button
                          onClick={() => openResolveModal(d)}
                          className="btn btn-primary btn-sm"
                        >
                          Resolve Ticket
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          {d.resolution ? `Resolved: ${d.resolution.substring(0, 30)}...` : 'Closed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Resolve Dispute #${selectedDispute?._id.slice(-6).toUpperCase()}`}
      >
        <form onSubmit={handleResolveDispute}>
          <div style={{ marginBottom: '1rem', background: '#F8FAFC', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>
              Claim: {selectedDispute?.reason}
            </div>
            <p style={{ color: 'var(--text-muted)' }}>{selectedDispute?.description}</p>
          </div>

          <div className="form-group">
            <label className="form-label">Resolution Decision</label>
            <select
              className="form-control"
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value)}
            >
              <option value="RESOLVED">RESOLVED (Customer Claim Accepted)</option>
              <option value="REJECTED">REJECTED (Claim Invalid / No Refund)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Authorized Refund Amount ($ USD)</label>
            <input
              type="number"
              min="0"
              className="form-control"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Resolution Summary & Explanation</label>
            <textarea
              rows={3}
              required
              className="form-control"
              placeholder="Explain the resolution terms that will be sent to the customer..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Finalizing...' : 'Finalize & Close Support Ticket'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default SupportDashboard;
