import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  MapPin,
  Star,
  AlertTriangle,
  Image as ImageIcon,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

const CustomerBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);

  // Modals state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeBookingId, setDisputeBookingId] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');

  const [submittingAction, setSubmittingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const openBookingDetails = async (booking) => {
    setSelectedBooking(booking);
    try {
      const res = await api.get(`/bookings/${booking._id}`);
      setEvidenceList(res.data.data.evidence || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmCompletion = async (bookingId) => {
    setErrorMsg('');
    setSubmittingAction(true);
    try {
      await api.post(`/bookings/${bookingId}/confirm-completion`);
      setSuccessMsg('Job completion confirmed! You can now leave a review.');
      await fetchBookings();
      if (selectedBooking?._id === bookingId) {
        setSelectedBooking((prev) => ({ ...prev, status: 'COMPLETED' }));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to confirm job completion');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmittingAction(true);
    try {
      await api.post('/reviews', {
        bookingId: reviewBookingId,
        rating: reviewRating,
        comment: reviewComment,
      });
      setSuccessMsg('Review submitted successfully! Thank you for your feedback.');
      setReviewModalOpen(false);
      setReviewComment('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmittingAction(true);
    try {
      await api.post('/disputes', {
        bookingId: disputeBookingId,
        reason: disputeReason,
        description: disputeDescription,
      });
      setSuccessMsg('Dispute ticket opened. A support agent has been notified.');
      setDisputeModalOpen(false);
      setDisputeReason('');
      setDisputeDescription('');
      await fetchBookings();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to raise dispute');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your bookings..." />;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Active & Completed Bookings</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track provider progress in real time, inspect job evidence, and confirm completion
          </p>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {successMsg}
        </div>
      )}

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Accept a quote from your service requests to confirm a booking."
        />
      ) : (
        <div className="grid-2">
          {/* Bookings List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bookings.map((b) => (
              <div
                key={b._id}
                className="card"
                style={{
                  cursor: 'pointer',
                  border: selectedBooking?._id === b._id ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                }}
                onClick={() => openBookingDetails(b)}
              >
                <div className="flex-between mb-2">
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    BOOKING #{b._id.slice(-6).toUpperCase()}
                  </span>
                  <StatusBadge status={b.status} />
                </div>

                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>
                  {b.serviceRequest?.title || 'Home Service'}
                </h3>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Provider: <strong>{b.provider?.name}</strong> • Phone: {b.provider?.phone || 'On file'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <span>{b.scheduledDate} ({b.startTime} - {b.endTime})</span>
                  <strong style={{ color: 'var(--primary-700)', fontSize: '1.1rem' }}>
                    ${b.quote?.amount || 0}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          {/* Booking Tracking & Details Panel */}
          <div>
            {selectedBooking ? (
              <div className="card">
                <div className="flex-between mb-4">
                  <div>
                    <h3 style={{ fontSize: '1.25rem' }}>Job Tracking</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      #{selectedBooking._id.slice(-6).toUpperCase()} • {selectedBooking.scheduledDate}
                    </div>
                  </div>
                  <StatusBadge status={selectedBooking.status} />
                </div>

                {/* Visual Status Progress Flow */}
                <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                    Job Lifecycle Status
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                    {['CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'].map((step, idx) => {
                      const stepOrder = ['CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED_PENDING_CONFIRMATION', 'COMPLETED'];
                      const currentIdx = stepOrder.indexOf(selectedBooking.status);
                      const isDone = currentIdx >= idx;

                      return (
                        <div key={step} style={{ textAlign: 'center', zIndex: 2 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: isDone ? 'var(--primary-600)' : '#E2E8F0',
                              color: isDone ? '#FFFFFF' : 'var(--text-dim)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              margin: '0 auto 0.35rem',
                            }}
                          >
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: isDone ? 'var(--text-main)' : 'var(--text-dim)' }}>
                            {step.replace(/_/g, ' ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Job Location & Notes */}
                <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Service Location:</strong> {selectedBooking.address?.street}, {selectedBooking.address?.city}, {selectedBooking.address?.zipCode}
                  </div>
                  <div>
                    <strong>Job Notes:</strong> {selectedBooking.notes || 'None provided'}
                  </div>
                </div>

                {/* Uploaded Evidence Photos */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ImageIcon size={18} />
                    <span>Uploaded Job Evidence ({evidenceList.length})</span>
                  </h4>

                  {evidenceList.length === 0 ? (
                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Provider has not uploaded before/after evidence yet.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                      {evidenceList.map((ev) => (
                        <div key={ev._id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#FFFFFF' }}>
                          <div style={{ padding: '0.4rem 0.6rem', background: '#F1F5F9', fontSize: '0.75rem', fontWeight: 700 }}>
                            {ev.type} EVIDENCE
                          </div>
                          <div style={{ padding: '0.65rem', fontSize: '0.85rem' }}>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{ev.description || 'Inspection photo'}</p>
                            <a
                              href={ev.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.8rem' }}
                            >
                              View Uploaded Image ↗
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {(selectedBooking.status === 'COMPLETED_PENDING_CONFIRMATION' || selectedBooking.status === 'IN_PROGRESS') && (
                    <button
                      onClick={() => handleConfirmCompletion(selectedBooking._id)}
                      className="btn btn-primary"
                      disabled={submittingAction}
                    >
                      <CheckCircle size={18} />
                      <span>{submittingAction ? 'Processing...' : 'Confirm Job Completion'}</span>
                    </button>
                  )}

                  {selectedBooking.status === 'COMPLETED' && (
                    <button
                      onClick={() => {
                        setReviewBookingId(selectedBooking._id);
                        setReviewModalOpen(true);
                      }}
                      className="btn btn-secondary"
                    >
                      <Star size={18} style={{ color: '#F59E0B' }} />
                      <span>Leave Provider Review</span>
                    </button>
                  )}

                  {selectedBooking.status !== 'CANCELLED' && selectedBooking.status !== 'COMPLETED' && (
                    <button
                      onClick={() => {
                        setDisputeBookingId(selectedBooking._id);
                        setDisputeModalOpen(true);
                      }}
                      className="btn btn-outline"
                      style={{ color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
                    >
                      <AlertTriangle size={18} />
                      <span>Raise Issue / Dispute</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                Select a booking from the left to view job tracking, schedule details, and evidence photos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review Your Service Provider"
      >
        <form onSubmit={handleSubmitReview}>
          <div className="form-group">
            <label className="form-label">Rating (1 to 5 Stars)</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setReviewRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: star <= reviewRating ? '#F59E0B' : '#CBD5E1',
                  }}
                >
                  <Star size={32} fill={star <= reviewRating ? '#F59E0B' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Review Comments</label>
            <textarea
              required
              rows={4}
              className="form-control"
              placeholder="How did the provider perform? Quality, punctuality, and professionalism..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={submittingAction}
          >
            {submittingAction ? 'Submitting Review...' : 'Submit Review'}
          </button>
        </form>
      </Modal>

      {/* Dispute Modal */}
      <Modal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        title="Raise a Service Dispute"
      >
        <form onSubmit={handleSubmitDispute}>
          <div className="form-group">
            <label className="form-label">Reason for Dispute</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Unfinished work / Provider did not arrive / Damage"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Explanation</label>
            <textarea
              required
              rows={4}
              className="form-control"
              placeholder="Provide specific details so our support team can investigate and process refunds..."
              value={disputeDescription}
              onChange={(e) => setDisputeDescription(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-danger"
            style={{ width: '100%' }}
            disabled={submittingAction}
          >
            {submittingAction ? 'Submitting Dispute...' : 'Submit to Support Team'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerBookingsPage;
