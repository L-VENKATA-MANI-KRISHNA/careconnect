import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Wrench, Shield, Check } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';

const ServicesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        setCategories(res.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Our Certified Service Domains</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: 650, margin: '0 auto 1.5rem' }}>
          Explore our complete catalog of certified trade professionals. All providers undergo background checks and license verification.
        </p>

        <div style={{ maxWidth: 460, margin: '0 auto', position: 'relative' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search domains (e.g. Plumbing, HVAC, Electrical)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading verified categories..." />
      ) : (
        <div className="grid-3">
          {filtered.map((cat) => (
            <div key={cat._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Wrench size={24} />
                </div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>{cat.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  {cat.description}
                </p>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
                    Required Technical Skills:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {cat.requiredSkills?.map((s, idx) => (
                      <span key={idx} style={{ background: '#F8FAFC', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-between" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard Base Fee</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                    ${cat.basePrice}
                  </div>
                </div>
                <Link to={`/customer/create-request?category=${cat._id}`} className="btn btn-primary btn-sm">
                  Request Service
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
