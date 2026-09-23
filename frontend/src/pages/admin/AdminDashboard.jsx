import React, { useEffect, useState } from 'react';
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Layers,
  PieChart,
} from 'lucide-react';
import api from '../../api/client';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then((res) => setAnalytics(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Calculating platform metrics..." />;

  const { users, bookings, revenue, providerPerformance, categoryStats, bookingTrends } = analytics || {};

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Platform Governance & Analytics</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Real-time database aggregated marketplace metrics, volume trends, and revenue insights
          </p>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="stats-grid">
        <StatCard
          icon={<DollarSign size={24} />}
          label="Total GMV Revenue"
          value={`$${revenue?.totalRevenue?.toLocaleString() || 0}`}
          subtext={`Platform Take: $${revenue?.platformFees?.toLocaleString() || 0}`}
        />
        <StatCard
          icon={<Briefcase size={24} />}
          label="Completed Jobs"
          value={bookings?.completedBookings || 0}
          subtext={`Active in-progress: ${bookings?.activeBookings || 0}`}
        />
        <StatCard
          icon={<Users size={24} />}
          label="Registered Users"
          value={users?.totalUsers || 0}
          subtext={`${users?.approvedProviders || 0} approved pros`}
        />
        <StatCard
          icon={<AlertTriangle size={24} style={{ color: 'var(--accent-amber)' }} />}
          label="Cancellation Rate"
          value={`${bookings?.cancellationRate || 0}%`}
          subtext={`${bookings?.cancelledBookings || 0} cancelled bookings`}
        />
      </div>

      <div className="grid-2">
        {/* Bookings Distribution by Category */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={18} />
              <span>Service Demand by Category</span>
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {categoryStats?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No request data available.</p>
            ) : (
              categoryStats?.map((cat, idx) => {
                const totalReqs = categoryStats.reduce((a, c) => a + c.count, 0) || 1;
                const pct = Math.round((cat.count / totalReqs) * 100);

                return (
                  <div key={idx}>
                    <div className="flex-between mb-1" style={{ fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600 }}>{cat.categoryName}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {cat.count} requests ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#F1F5F9', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, var(--primary-500), var(--accent-purple))',
                          borderRadius: 'var(--radius-full)',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quality & Performance Overview */}
        <div className="card">
          <div className="flex-between mb-4">
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} />
              <span>Provider Fleet Quality</span>
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Average Fleet Rating</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706' }}>
                  {providerPerformance?.avgRating || 5.0} ★
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pending Verifications</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                  {users?.pendingVerifications || 0}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Disputed Bookings</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                  {bookings?.disputedBookings || 0}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Average Booking GMV</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-teal)' }}>
                  ${revenue?.avgBookingValue || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
