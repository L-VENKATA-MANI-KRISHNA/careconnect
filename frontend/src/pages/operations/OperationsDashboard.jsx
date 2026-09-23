import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock, AlertTriangle, Users, Briefcase, ArrowRight } from 'lucide-react';
import api from '../../api/client';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const OperationsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/operations/dashboard-summary')
      .then((res) => setData(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading Operations Dispatch center..." />;

  const { metrics, activeJobs } = data || {};

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Operations Control & Dispatch</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Real-time monitoring of marketplace fulfillment, delayed jobs, and provider assignments
          </p>
        </div>
        <Link to="/operations/dispatch" className="btn btn-primary">
          <Briefcase size={18} />
          <span>Dispatch Unassigned Requests</span>
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<Clock size={24} style={{ color: 'var(--primary-600)' }} />}
          label="Active Bookings In Flight"
          value={metrics?.activeBookingsCount || 0}
        />
        <StatCard
          icon={<Briefcase size={24} style={{ color: 'var(--accent-amber)' }} />}
          label="Unassigned Requests"
          value={metrics?.unassignedRequestsCount || 0}
        />
        <StatCard
          icon={<AlertTriangle size={24} style={{ color: 'var(--accent-rose)' }} />}
          label="Open Escalations / Disputes"
          value={metrics?.openDisputesCount || 0}
        />
        <StatCard
          icon={<Users size={24} style={{ color: 'var(--accent-teal)' }} />}
          label="Pending Provider Onboardings"
          value={metrics?.pendingVerificationsCount || 0}
        />
      </div>

      <div className="card">
        <div className="flex-between mb-4">
          <h3 style={{ fontSize: '1.15rem' }}>Active Marketplace Jobs Monitor</h3>
          <Link to="/operations/dispatch" className="btn btn-outline btn-sm">
            Manage Assignments
          </Link>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Category</th>
                <th>Customer</th>
                <th>Assigned Provider</th>
                <th>Scheduled Window</th>
                <th>Job Status</th>
              </tr>
            </thead>
            <tbody>
              {activeJobs?.map((j) => (
                <tr key={j._id}>
                  <td>
                    <strong>{j.serviceRequest?.title || 'Home Service'}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      #{j._id.slice(-6).toUpperCase()}
                    </div>
                  </td>
                  <td>{j.serviceRequest?.category?.name || 'General'}</td>
                  <td>{j.customer?.name} ({j.customer?.phone || 'No phone'})</td>
                  <td>{j.provider?.name} ({j.provider?.phone || 'No phone'})</td>
                  <td>{j.scheduledDate} • {j.startTime}</td>
                  <td>
                    <StatusBadge status={j.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OperationsDashboard;
