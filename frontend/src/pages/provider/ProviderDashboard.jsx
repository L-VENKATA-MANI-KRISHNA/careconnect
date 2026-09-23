import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Star,
  Clock,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const ProviderDashboard = () => {
  const { providerProfile, user } = useAuth();
  const [stats, setStats] = useState({ requests: 0, jobs: 0, revenue: 0 });
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/service-requests?limit=5'),
      api.get('/bookings?limit=5'),
      api.get('/invoices?status=PAID'),
    ])
      .then(([reqRes, bookRes, invRes]) => {
        const totalEarnings = (invRes.data.data.data || []).reduce((acc, i) => acc + i.subtotal, 0);
        setStats({
          requests: reqRes.data.data.pagination.total,
          jobs: bookRes.data.data.pagination.total,
          revenue: totalEarnings,
        });
        setActiveJobs(bookRes.data.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading provider dashboard..." />;

  const isApproved = providerProfile?.verificationStatus === 'APPROVED';

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Provider Operations Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Welcome back, <strong>{providerProfile?.businessName || user?.name}</strong>
          </p>
        </div>
        <Link to="/provider/requests" className="btn btn-primary">
          Browse Open Requests
        </Link>
      </div>

      {/* Verification Warning Alert if not approved */}
      {!isApproved && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', color: '#92400E', padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShieldAlert size={24} style={{ color: '#D97706' }} />
            <div>
              <strong>Account Verification Pending:</strong> Please upload your contractor license or proof of insurance in your profile to receive confirmed bookings.
            </div>
          </div>
          <Link to="/provider/profile" className="btn btn-secondary btn-sm">
            Upload Documents
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          icon={<Briefcase size={24} />}
          label="Completed Jobs"
          value={providerProfile?.completedJobs || 0}
        />
        <StatCard
          icon={<Star size={24} fill="#F59E0B" style={{ color: '#F59E0B' }} />}
          label="Customer Rating"
          value={`${providerProfile?.rating?.toFixed(1) || '5.0'} ★`}
          subtext={`${providerProfile?.totalReviews || 0} customer reviews`}
        />
        <StatCard
          icon={<DollarSign size={24} />}
          label="Total Earnings"
          value={`$${stats.revenue.toLocaleString()}`}
        />
        <StatCard
          icon={<Clock size={24} />}
          label="Verification Status"
          value={<StatusBadge status={providerProfile?.verificationStatus || 'PENDING'} />}
        />
      </div>

      {/* Active Jobs List */}
      <div className="card">
        <div className="flex-between mb-4">
          <h3 style={{ fontSize: '1.15rem' }}>Active Customer Bookings</h3>
          <Link to="/provider/jobs" className="btn btn-outline btn-sm">
            Manage Jobs
          </Link>
        </div>

        {activeJobs.length === 0 ? (
          <EmptyState
            title="No active bookings right now"
            description="Submit quotes for eligible customer requests in your trade category to win jobs."
            action={
              <Link to="/provider/requests" className="btn btn-primary btn-sm">
                View Open Requests
              </Link>
            }
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Customer</th>
                  <th>Date & Time</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeJobs.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <strong>{b.serviceRequest?.title || 'Service Job'}</strong>
                    </td>
                    <td>{b.customer?.name}</td>
                    <td>{b.scheduledDate} ({b.startTime})</td>
                    <td>{b.address?.city}, {b.address?.zipCode}</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>
                      <Link to="/provider/jobs" className="btn btn-secondary btn-sm">
                        Update Status
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;
