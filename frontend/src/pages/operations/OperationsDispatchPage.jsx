import React, { useEffect, useState } from 'react';
import { Briefcase, UserCheck, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

const OperationsDispatchPage = () => {
  const [requests, setRequests] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dispatch modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchData = async () => {
    try {
      const [rRes, pRes] = await Promise.all([
        api.get('/operations/unassigned-requests'),
        api.get('/providers?limit=50'),
      ]);
      setRequests(rRes.data.data || []);
      const provList = pRes.data.data.data || [];
      setProviders(provList);
      if (provList.length > 0 && !selectedProviderId) {
        setSelectedProviderId(provList[0].user?._id || provList[0]._id);
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

  const openAssignModal = (req) => {
    setSelectedRequest(req);
    setModalOpen(true);
  };

  const handleAssignProvider = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');

    try {
      await api.post('/operations/assign-provider', {
        requestId: selectedRequest._id,
        providerId: selectedProviderId,
      });

      setMsg(`Provider assigned to request #${selectedRequest._id.slice(-6).toUpperCase()}`);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dispatch queue..." />;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Dispatcher Work Queue</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Unassigned customer requests requiring manual dispatcher routing or escalation
          </p>
        </div>
      </div>

      {msg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {msg}
        </div>
      )}

      {requests.length === 0 ? (
        <EmptyState
          title="All service requests are assigned or fulfilled"
          description="Great job! There are currently no unassigned requests in the dispatch pipeline."
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Request Title</th>
                <th>Category</th>
                <th>Customer</th>
                <th>City / Zip</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>
                    <strong>{r.title}</strong>
                  </td>
                  <td>{r.category?.name}</td>
                  <td>{r.customer?.name}</td>
                  <td>{r.location?.city}, {r.location?.zipCode}</td>
                  <td>
                    <span className="badge badge-pending">{r.urgency}</span>
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    <button
                      onClick={() => openAssignModal(r)}
                      className="btn btn-primary btn-sm"
                    >
                      <UserCheck size={16} />
                      <span>Assign Provider</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Provider Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Assign Provider to: ${selectedRequest?.title}`}
      >
        <form onSubmit={handleAssignProvider}>
          <div className="form-group">
            <label className="form-label">Select Verified Provider</label>
            <select
              className="form-control"
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
            >
              {providers.map((p) => (
                <option key={p._id} value={p.user?._id || p._id}>
                  {p.businessName || p.user?.name} ({p.user?.name}) • {p.rating}★
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Assigning...' : 'Confirm Assignment & Notify Provider'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default OperationsDispatchPage;
