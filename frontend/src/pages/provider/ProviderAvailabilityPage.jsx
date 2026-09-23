import React, { useEffect, useState } from 'react';
import { Clock, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const ProviderAvailabilityPage = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSlots = async () => {
    try {
      const res = await api.get('/availability/me');
      setSlots(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      await api.post('/availability/me', { date, startTime, endTime });
      await fetchSlots();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add availability slot. Overlapping times are rejected.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    try {
      await api.delete(`/availability/me/${id}`);
      setSlots((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner message="Loading availability calendar..." />;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Availability & Schedule Slots</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Configure working hours. Server-side conflict detection prevents double bookings.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid-2">
        {/* Add Slot Form Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Add Working Window</h3>
          <form onSubmit={handleAddSlot}>
            <div className="form-group">
              <label className="form-label">Service Date</label>
              <input
                type="date"
                required
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Start Time (24h)</label>
                <input
                  type="time"
                  required
                  className="form-control"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time (24h)</label>
                <input
                  type="time"
                  required
                  className="form-control"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              <Plus size={18} />
              <span>{submitting ? 'Adding...' : 'Add Availability Slot'}</span>
            </button>
          </form>
        </div>

        {/* Existing Slots List */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
            Current Configured Slots ({slots.length})
          </h3>

          {slots.length === 0 ? (
            <EmptyState
              title="No availability slots scheduled"
              description="Add slots on the left to indicate when you are ready to accept customer jobs."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 420, overflowY: 'auto' }}>
              {slots.map((s) => (
                <div
                  key={s._id}
                  style={{
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#FFFFFF',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {s.date}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {s.startTime} — {s.endTime}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <StatusBadge status={s.status} />
                    <button
                      onClick={() => handleDeleteSlot(s._id)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--accent-rose)', padding: '0.35rem' }}
                      title="Remove Slot"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderAvailabilityPage;
