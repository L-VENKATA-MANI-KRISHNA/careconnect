import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, User, LayoutDashboard, Wrench, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'PLATFORM_ADMIN':
        return '/admin/dashboard';
      case 'OPERATIONS_MANAGER':
        return '/operations/dashboard';
      case 'SUPPORT_AGENT':
        return '/support/dashboard';
      case 'SERVICE_PROVIDER':
        return '/provider/dashboard';
      case 'CUSTOMER':
      default:
        return '/customer/dashboard';
    }
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand-logo">
          <div className="brand-icon">
            <Wrench size={22} />
          </div>
          <span>Care<span style={{ color: 'var(--accent-teal)' }}>Connect</span></span>
        </Link>

        <div className="nav-links">
          <Link to="/services" className="nav-link">Explore Services</Link>

          {user ? (
            <>
              <Link to={getDashboardPath()} className="btn btn-secondary btn-sm">
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>

              <NotificationDropdown />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'var(--primary-100)',
                    color: 'var(--primary-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  {user.name?.charAt(0)}
                </div>
                <div style={{ lineHeight: 1.1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {user.role.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
