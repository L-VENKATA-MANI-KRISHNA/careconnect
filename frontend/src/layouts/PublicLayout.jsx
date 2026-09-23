import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Wrench } from 'lucide-react';

const PublicLayout = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <footer style={{ background: '#FFFFFF', borderTop: '1px solid var(--border-subtle)', padding: '2.5rem 0', marginTop: '4rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="brand-icon" style={{ width: 32, height: 32 }}>
              <Wrench size={18} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>CareConnect</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            © {new Date().getFullYear()} CareConnect Technologies Inc. Production Capstone Home Services Marketplace.
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <Link to="/services">Services</Link>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Become a Provider</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
