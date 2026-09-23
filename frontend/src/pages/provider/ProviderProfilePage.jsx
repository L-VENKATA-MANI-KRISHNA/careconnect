import React, { useEffect, useState } from 'react';
import { ShieldCheck, Upload, FileText, CheckCircle, AlertCircle, Save, Check } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const ProviderProfilePage = () => {
  const { providerProfile, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState(65);
  const [experienceYears, setExperienceYears] = useState(5);
  const [availabilityNotes, setAvailabilityNotes] = useState('');
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Document upload state
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('LICENSE');
  const [docFile, setDocFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProfile = async () => {
    try {
      const [resProfile, resCats] = await Promise.all([
        api.get('/providers/me/profile'),
        api.get('/categories'),
      ]);
      const p = resProfile.data.data;
      setProfile(p);
      setBusinessName(p.businessName || '');
      setBio(p.bio || '');
      setHourlyRate(p.hourlyRate || 65);
      setExperienceYears(p.experienceYears || 1);
      setAvailabilityNotes(p.availabilityNotes || '');
      setSelectedCategories(
        (p.serviceCategories || []).map((c) => (typeof c === 'object' && c ? c._id : c))
      );
      setAllCategories(resCats.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const toggleCategory = (catId) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setErrorMsg('');

    try {
      await api.patch('/providers/me/profile', {
        businessName,
        bio,
        hourlyRate: Number(hourlyRate),
        experienceYears: Number(experienceYears),
        availabilityNotes,
        serviceCategories: selectedCategories,
      });
      setMsg('Profile details and trade categories updated successfully!');
      await refreshUser();
      await fetchProfile();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docFile) {
      setErrorMsg('Please select a document file');
      return;
    }

    setUploadingDoc(true);
    setMsg('');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('title', docTitle || 'Contractor License');
      formData.append('documentType', docType);
      formData.append('document', docFile);

      await api.post('/providers/me/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMsg('Document uploaded! Admin team will review your application.');
      setDocFile(null);
      setDocTitle('');
      await refreshUser();
      await fetchProfile();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your provider profile..." />;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Provider Profile & Verification</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Manage your public business listing, trade categories, rates, and submit licensing documents
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verification Status:</span>
          <StatusBadge status={profile?.verificationStatus || 'PENDING'} />
        </div>
      </div>

      {msg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid-2">
        {/* Business Profile Details Form */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Business Profile & Services</h3>
          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input
                type="text"
                required
                className="form-control"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Professional Bio / Trade Background</label>
              <textarea
                rows={3}
                className="form-control"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {/* Trade Categories Selection */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Trade Categories Offered</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {selectedCategories.length} selected
                </span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
                {allCategories.map((c) => {
                  const isSelected = selectedCategories.includes(c._id);
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => toggleCategory(c._id)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: `1.5px solid ${isSelected ? 'var(--primary-600)' : 'var(--border-subtle)'}`,
                        background: isSelected ? 'var(--primary-50)' : '#FFFFFF',
                        color: isSelected ? 'var(--primary-700)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s',
                      }}
                    >
                      {isSelected && <Check size={14} />}
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Hourly Rate ($ USD)</label>
                <input
                  type="number"
                  min="20"
                  className="form-control"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Availability / Operating Notes</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Mon-Sat: 8am - 6pm"
                value={availabilityNotes}
                onChange={(e) => setAvailabilityNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={18} />
              <span>{saving ? 'Saving changes...' : 'Save Profile Details'}</span>
            </button>
          </form>
        </div>

        {/* Verification & Documents Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>
            Trade License & Verification Documents
          </h3>

          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)', fontSize: '0.875rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
              Current Status: {profile?.verificationStatus}
            </div>
            <p style={{ color: 'var(--text-muted)' }}>
              {profile?.verificationNotes || 'Only approved providers receive confirmed bookings and payouts.'}
            </p>
          </div>

          {/* Document Upload Form */}
          <form onSubmit={handleUploadDocument} style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Upload Verification Document</h4>

            <div className="form-group">
              <label className="form-label">Document Title</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. State Contractor License #104829"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Document Type</label>
                <select
                  className="form-control"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  <option value="LICENSE">Trade / Contractor License</option>
                  <option value="INSURANCE">Proof of General Liability Insurance</option>
                  <option value="ID">Government Issued Photo ID</option>
                  <option value="CERTIFICATION">Trade Certification</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select File (PDF, Image)</label>
                <input
                  type="file"
                  required
                  accept="image/*,.pdf,.doc,.docx"
                  className="form-control"
                  onChange={(e) => setDocFile(e.target.files[0])}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-secondary btn-sm" disabled={uploadingDoc}>
              <Upload size={16} />
              <span>{uploadingDoc ? 'Uploading Document...' : 'Upload Document'}</span>
            </button>
          </form>

          {/* Uploaded Documents List */}
          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>
              Uploaded Documents ({profile?.documents?.length || 0})
            </h4>

            {(!profile?.documents || profile.documents.length === 0) ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No documents uploaded yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {profile.documents.map((d, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Type: {d.documentType} • Uploaded: {new Date(d.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--primary-600)', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      View ↗
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfilePage;
