import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  ShieldCheck,
  Zap,
  Sparkles,
  Clock,
  Star,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import api from '../../api/client';

const LandingPage = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data.data.slice(0, 6)))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-100)', color: 'var(--primary-700)', padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            <Sparkles size={16} />
            <span>AI-Assisted Classification & Verified Trade Marketplace</span>
          </div>

          <h1 className="hero-title">
            Exceptional Home Care.<br />Zero Guesswork.
          </h1>

          <p className="hero-subtitle">
            Book top-rated, certified local trade professionals for plumbing, electrical, HVAC, and cleaning with intelligent matching and conflict-free real-time scheduling.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/customer/create-request" className="btn btn-primary btn-lg">
              <span>Post a Service Request</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/services" className="btn btn-secondary btn-lg">
              Explore All Services
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div className="flex-between mb-6">
            <div>
              <h2 style={{ fontSize: '1.85rem' }}>Featured Service Domains</h2>
              <p style={{ color: 'var(--text-muted)' }}>Vetted, licensed professionals ready to assist you today</p>
            </div>
            <Link to="/services" className="btn btn-outline btn-sm">
              View All 9 Domains
            </Link>
          </div>

          <div className="grid-3">
            {categories.map((cat) => (
              <div key={cat._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <Wrench size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{cat.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.4 }}>
                    {cat.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                    {cat.requiredSkills?.slice(0, 3).map((s, idx) => (
                      <span key={idx} style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-between" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Starting at <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>${cat.basePrice}</strong>
                  </span>
                  <Link to="/customer/create-request" className="btn btn-secondary btn-sm">
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section style={{ padding: '4rem 0', background: '#FFFFFF', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>How CareConnect Works</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto 3rem' }}>
            From request creation to final job sign-off in 4 transparent, verified steps.
          </p>

          <div className="grid-2" style={{ textAlign: 'left' }}>
            <div className="card">
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-600)', marginBottom: '0.5rem' }}>01</div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Instant AI Classification</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Describe your issue naturally. Our AI extracts required technical skills, assigns service urgency, and opens the job for matching providers.
              </p>
            </div>
            <div className="card">
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-600)', marginBottom: '0.5rem' }}>02</div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Compare Verified Quotes</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Receive competitive, detailed quotes from certified pros with transparent ratings, completed job counts, and availability windows.
              </p>
            </div>
            <div className="card">
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-600)', marginBottom: '0.5rem' }}>03</div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Conflict-Free Scheduling</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Server-side scheduling engine prevents overlapping bookings so your provider arrives on time, fully dedicated to your home.
              </p>
            </div>
            <div className="card">
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-600)', marginBottom: '0.5rem' }}>04</div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Photo Evidence & Safe Payment</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Inspect before-and-after work photos uploaded by the provider. Invoices are finalized only after you confirm your satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
