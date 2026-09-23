import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Send,
  DollarSign,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

const ProviderRequestsPage = () => {
  const { providerProfile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filterMyTrades, setFilterMyTrades] = useState(false);

  // Quote modal
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [amount, setAmount] = useState(120);
  const [estimatedDuration, setEstimatedDuration] = useState('2 hours');
  const [availableDate, setAvailableDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [availableTime, setAvailableTime] = useState('09:00');
  const [message, setMessage] = useState('');

  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch categories for filtering
  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch((err) => console.error(err));
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (filterMyTrades) params.append('myTrades', 'true');

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/service-requests${queryString}`);
      setRequests(res.data.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [selectedCategory, filterMyTrades]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRequests();
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSearchTerm('');
    setFilterMyTrades(false);
  };

  const openQuoteModal = (req) => {
    setSelectedRequest(req);
    setAmount(req.budget || 120);
    setAvailableDate(req.preferredDate || new Date().toISOString().split('T')[0]);
    setQuoteModalOpen(true);
    setErrorMsg('');
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmittingQuote(true);

    try {
      await api.post('/quotes', {
        serviceRequestId: selectedRequest._id,
        amount: Number(amount),
        estimatedDuration,
        availableDate,
        availableTime,
        message,
      });

      setFeedbackMsg(`Quote of $${amount} submitted successfully!`);
      setQuoteModalOpen(false);
      setMessage('');
      await fetchRequests();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit quote');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const isApproved = providerProfile?.verificationStatus === 'APPROVED';
  const hasProfileCategories = (providerProfile?.serviceCategories?.length || 0) > 0;

  return (
    <div>
      <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Open Customer Service Requests</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Browse open requests posted by customers, view required skills, and submit quote proposals
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Total Open Jobs: <strong>{requests.length}</strong>
          </span>
        </div>
      </div>

      {/* Verification Notice if not approved yet */}
      {!isApproved && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', color: '#92400E', padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={22} style={{ color: '#D97706' }} />
            <div>
              <strong>Account Verification Pending:</strong> You can view all customer service requests below. To submit quotes and win customer bookings, please complete your trade license verification in your profile.
            </div>
          </div>
          <Link to="/provider/profile" className="btn btn-secondary btn-sm">
            Upload Documents
          </Link>
        </div>
      )}

      {feedbackMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={20} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="card mb-6" style={{ padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search by issue, keyword, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Dropdown */}
          <div style={{ minWidth: 200 }}>
            <select
              className="form-control"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Trade Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* My Categories Toggle */}
          {hasProfileCategories && (
            <button
              type="button"
              onClick={() => setFilterMyTrades(!filterMyTrades)}
              className={`btn btn-sm ${filterMyTrades ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Filter size={15} />
              <span>{filterMyTrades ? 'My Categories Only' : 'All Marketplace'}</span>
            </button>
          )}

          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>

          {(selectedCategory || searchTerm || filterMyTrades) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary btn-sm"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {loading ? (
        <LoadingSpinner message="Searching for open service requests..." />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No open requests found"
          description="There are currently no customer requests matching your filter criteria. Try resetting your search or check back soon."
          action={
            (selectedCategory || searchTerm || filterMyTrades) && (
              <button onClick={handleResetFilters} className="btn btn-primary btn-sm">
                View All Customer Requests
              </button>
            )
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {requests.map((r) => (
            <div key={r._id} className="card" style={{ transition: 'box-shadow 0.2s' }}>
              <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{r.title}</h3>
                  <StatusBadge status={r.status} />
                  <span className="badge" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)', fontWeight: 600 }}>
                    {r.category?.name || 'General Service'}
                  </span>
                  <span className="badge badge-pending">Urgency: {r.urgency}</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                  Customer Budget: ${r.budget || 'Flexible'}
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                {r.description}
              </p>

              {/* Skills and Location Details */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={15} style={{ color: 'var(--primary-500)' }} />
                  <strong>Location:</strong> {r.location?.city || 'San Francisco'}, {r.location?.zipCode || '94107'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={15} style={{ color: 'var(--primary-500)' }} />
                  <strong>Preferred Date:</strong> {r.preferredDate} ({r.preferredTime})
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <strong>Customer:</strong> {r.customer?.name || 'Homeowner'}
                </span>
              </div>

              {r.requiredSkills && r.requiredSkills.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                    REQUIRED SKILLS:
                  </span>
                  {r.requiredSkills.map((s, idx) => (
                    <span key={idx} style={{ background: 'var(--primary-50)', color: 'var(--primary-700)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600 }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex-between" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Posted {new Date(r.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => openQuoteModal(r)}
                  className="btn btn-primary btn-sm"
                  disabled={!isApproved}
                  title={!isApproved ? 'Only verified providers can submit quotes' : ''}
                >
                  <Send size={16} />
                  <span>Submit Quote Proposal</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote Submission Modal */}
      <Modal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        title={`Submit Quote Proposal: ${selectedRequest?.title}`}
      >
        <form onSubmit={handleSubmitQuote}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Quote Amount ($ USD)</label>
              <input
                type="number"
                required
                min="10"
                className="form-control"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Duration</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. 2 hours"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Available Date</label>
              <input
                type="date"
                required
                className="form-control"
                value={availableDate}
                onChange={(e) => setAvailableDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Available Time</label>
              <input
                type="time"
                required
                className="form-control"
                value={availableTime}
                onChange={(e) => setAvailableTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Message / Work Proposal</label>
            <textarea
              rows={3}
              className="form-control"
              placeholder="State what replacement parts or tools you have ready and why you are the best fit..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={submittingQuote}
          >
            {submittingQuote ? 'Submitting Quote...' : 'Confirm & Send Quote to Customer'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ProviderRequestsPage;
