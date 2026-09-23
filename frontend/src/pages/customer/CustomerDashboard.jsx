import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  CalendarCheck,
  FileText,
  DollarSign,
  PlusCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import api from '../../api/client';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const CustomerDashboard = () => {
  const [stats, setStats] = useState({ requests: 0, bookings: 0, invoices: 0 });
  const [activeBookings, setActiveBookings] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/service-requests?limit=5'),
      api.get('/bookings?limit=5'),
      api.get('/invoices?limit=5'),
    ])
      .then(([reqRes, bookRes, invRes]) => {
        setStats({
          requests: reqRes.data.data.pagination.total,
          bookings: bookRes.data.data.pagination.total,
          invoices: invRes.data.data.pagination.total,
        });
        setRecentRequests(reqRes.data.data.data || []);
        setActiveBookings(bookRes.data.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading your dashboard overview..." />;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Customer Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage service requests, compare quotes, and track bookings</p>
        </div>
        <Link to="/customer/create-request" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>New Service Request</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          icon={<ClipboardList size={24} />}
          label="Total Requests"
          value={stats.requests}
        />
        <StatCard
          icon={<CalendarCheck size={24} />}
          label="Active Bookings"
          value={stats.bookings}
        />
        <StatCard
          icon={<FileText size={24} />}
          label="Invoices & Receipts"
          value={stats.invoices}
        />
      </div>

      <div className="grid-2">
        {/* Active Bookings Card */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{ fontSize: '1.15rem' }}>Active Bookings</h3>
            <Link to="/customer/bookings" className="btn btn-outline btn-sm">
              View All
            </Link>
          </div>

          {activeBookings.length === 0 ? (
            <EmptyState
              title="No active bookings"
              description="When you accept a provider quote, your confirmed booking will appear here."
              action={
                <Link to="/customer/create-request" className="btn btn-primary btn-sm">
                  Request a Service
                </Link>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeBookings.map((b) => (
                <div
                  key={b._id}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {b.serviceRequest?.title || 'Service Booking'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      Provider: <strong>{b.provider?.name}</strong> • Scheduled: {b.scheduledDate} at {b.startTime}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <StatusBadge status={b.status} />
                    <Link to="/customer/bookings" className="btn btn-secondary btn-sm">
                      Track
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Service Requests */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{ fontSize: '1.15rem' }}>Recent Requests & Quotes</h3>
            <Link to="/customer/requests" className="btn btn-outline btn-sm">
              View All
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <EmptyState
              title="No service requests"
              description="Submit a request to receive competitive quotes from verified trade professionals."
              action={
                <Link to="/customer/create-request" className="btn btn-primary btn-sm">
                  Create Request
                </Link>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentRequests.map((r) => (
                <div
                  key={r._id}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      {r.category?.name} • Preferred: {r.preferredDate}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <StatusBadge status={r.status} />
                    <Link to="/customer/requests" className="btn btn-secondary btn-sm">
                      Quotes
                    </Link>
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

export default CustomerDashboard;
