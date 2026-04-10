import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: 'admin@pos.com', password: 'admin123' },
      manager: { email: 'manager@pos.com', password: 'manager123' },
      cashier: { email: 'cashier@pos.com', password: 'cashier123' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1a1a2e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: 'var(--primary)', borderRadius: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#fff', marginBottom: 16 }}>
            <i className="fa-solid fa-store"></i>
          </div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700 }}>QuickPOS</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>Sign in to your account</p>
        </div>

        <div className="card">
          <div className="card-body">
            {error && (
              <div className="alert alert-danger">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="search-box">
                  <i className="fa-solid fa-envelope"></i>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ paddingLeft: 36 }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="search-box">
                  <i className="fa-solid fa-lock"></i>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingLeft: 36 }}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Signing in...</> : <><i className="fa-solid fa-right-to-bracket"></i> Sign In</>}
              </button>
            </form>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-body" style={{ padding: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 10, fontWeight: 600 }}>DEMO ACCOUNTS</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['admin', 'manager', 'cashier'].map((role) => (
                <button key={role} onClick={() => fillDemo(role)} className="btn btn-outline btn-sm" style={{ textTransform: 'capitalize', flex: 1 }}>
                  <i className="fa-solid fa-user"></i> {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
