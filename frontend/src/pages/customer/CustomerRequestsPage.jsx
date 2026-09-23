import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle,
  Clock,
  Star,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const CustomerRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [quotesMap, setQuotesMap] = useState({});
  const [acceptingQuoteId, setAcceptingQuoteId] = useState(null);
  const [actionError, setActionError] = useState('');

  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const res = await api.get('/service-requests');
      const list = res.data.data.data || [];
      setRequests(list);
      if (list.length > 0 && !selectedRequestId) {
        loadQuotesForRequest(list[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const loadQuotesForRequest = async (reqId) => {
    setSelectedRequestId(reqId);
    if (quotesMap[reqId]) return;

    try {
      const res = await api.get(`/quotes/request/${reqId}`);
      setQuotesMap((prev) => ({
        ...prev,
        [reqId]: res.data.data || [],
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptQuote = async (quoteId) => {
    setActionError('');
    setAcceptingQuoteId(quoteId);

    try {
      await api.post(`/bookings/accept-quote/${quoteId}`, {
        notes: 'Quote accepted by customer from marketplace.',
      });
      navigate('/customer/bookings');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to accept quote. Check for booking conflicts.');
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your service requests..." />;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>My Service Requests & Quotes</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Compare competitive quotes from verified trade professionals and confirm your booking
          </p>
        </div>
        <Link to="/customer/create-request" className="btn btn-primary">
          Post Another Request
        </Link>
      </div>

      {actionError && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span>{actionError}</span>
        </div>
      )}

      {requests.length === 0 ? (
        <EmptyState
          title="No service requests yet"
          description="You haven't posted any service requests yet. Create a request to get matched with pros."
          action={
            <Link to="/customer/create-request" className="btn btn-primary">
              Create Service Request
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {requests.map((r) => {
            const isExpanded = selectedRequestId === r._id;
            const quotes = quotesMap[r._id] || [];

            return (
              <div key={r._id} className="card">
                <div
                  onClick={() => (isExpanded ? setSelectedRequestId(null) : loadQuotesForRequest(r._id))}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                      <h3 style={{ fontSize: '1.25rem' }}>{r.title}</h3>
                      <StatusBadge status={r.status} />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.65rem' }}>
                      {r.description}
                    </p>
                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span><strong>Category:</strong> {r.category?.name}</span>
                      <span><strong>Location:</strong> {r.location?.city}, {r.location?.zipCode}</span>
                      <span><strong>Preferred:</strong> {r.preferredDate} ({r.preferredTime})</span>
                      <span><strong>Budget:</strong> ${r.budget}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                      {quotes.length} {quotes.length === 1 ? 'Quote' : 'Quotes'}
                    </span>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Quotes Section Drawer */}
                {isExpanded && (
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>
                      Received Quotes for this Request ({quotes.length})
                    </h4>

                    {quotes.length === 0 ? (
                      <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Waiting for verified trade providers to submit quotes for this request. Check back shortly.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {quotes.map((q) => {
                          const prof = q.providerProfile;
                          const isAccepted = q.status === 'ACCEPTED';
                          const isRejected = q.status === 'REJECTED';

                          return (
                            <div
                              key={q._id}
                              style={{
                                border: isAccepted ? '2px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                                background: isAccepted ? '#F0FDF4' : '#FFFFFF',
                                borderRadius: 'var(--radius-lg)',
                                padding: '1.25rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '1rem',
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 260 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                                    {prof?.businessName || q.provider?.name}
                                  </span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#D97706', fontSize: '0.85rem', fontWeight: 700 }}>
                                    <Star size={14} fill="#F59E0B" />
                                    <span>{prof?.rating?.toFixed(1) || '5.0'}</span>
                                    <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({prof?.totalReviews || 0} reviews)</span>
                                  </span>
                                  <StatusBadge status={q.status} />
                                </div>

                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                  "{q.message || 'Ready to perform professional service.'}"
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  <span>Estimated Duration: <strong>{q.estimatedDuration}</strong></span>
                                  <span>Available Date: <strong>{q.availableDate} at {q.availableTime}</strong></span>
                                  <span>Jobs Completed: <strong>{prof?.completedJobs || 0}</strong></span>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                                  ${q.amount}
                                </div>

                                {q.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleAcceptQuote(q._id)}
                                    className="btn btn-primary btn-sm"
                                    disabled={acceptingQuoteId === q._id}
                                  >
                                    <CheckCircle size={16} />
                                    <span>{acceptingQuoteId === q._id ? 'Accepting...' : 'Accept Quote & Book'}</span>
                                  </button>
                                )}

                                {isAccepted && (
                                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.9rem' }}>
                                    ✓ Quote Accepted
                                  </span>
                                )}

                                {isRejected && (
                                  <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                    Competing Quote Closed
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerRequestsPage;
