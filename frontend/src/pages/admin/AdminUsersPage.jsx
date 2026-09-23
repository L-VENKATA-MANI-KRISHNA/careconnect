import React, { useEffect, useState } from 'react';
import { Users, Search, Shield, UserX, UserCheck, CheckCircle } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isActive: !currentStatus });
      setActionMsg(`User status updated to ${!currentStatus ? 'Active' : 'Deactivated'}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setActionMsg(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner message="Loading user directory..." />;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>User Governance Directory</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Search, manage account activation states, and assign administrative roles
          </p>
        </div>
      </div>

      {actionMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {actionMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card mb-6" style={{ padding: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
          </div>

          <div style={{ width: 200 }}>
            <select
              className="form-control"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="SERVICE_PROVIDER">Service Provider</option>
              <option value="OPERATIONS_MANAGER">Operations Manager</option>
              <option value="SUPPORT_AGENT">Support Agent</option>
              <option value="PLATFORM_ADMIN">Platform Admin</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>Current Role</th>
              <th>Account State</th>
              <th>Change Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>
                  <strong>{u.name}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Joined: {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className="badge badge-confirmed">
                    {u.role.replace(/_/g, ' ')}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-completed' : 'badge-cancelled'}`}>
                    {u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                  </span>
                </td>
                <td>
                  <select
                    className="form-control"
                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', width: 160 }}
                    value={u.role}
                    onChange={(e) => handleChangeRole(u._id, e.target.value)}
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="SERVICE_PROVIDER">SERVICE_PROVIDER</option>
                    <option value="OPERATIONS_MANAGER">OPERATIONS_MANAGER</option>
                    <option value="SUPPORT_AGENT">SUPPORT_AGENT</option>
                    <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => handleToggleStatus(u._id, u.isActive)}
                    className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                    <span>{u.isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;
