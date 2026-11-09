import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const SHOWCASE_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
    alt: 'Artisanal catering spread with gourmet dishes',
  },
  {
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Freshly plated seasonal salad and citrus',
  },
  {
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    alt: 'Curated banquet table for special celebrations',
  },
];

export default function AuthForm({ mode }) {
  const register = mode === 'register';
  
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (register && form.password !== form.confirm_password) {
      return setError('Passwords do not match.');
    }

    setSaving(true);
    try {
      const endpoint = register ? '/auth/register' : '/auth/login';
      const payload = register 
        ? { full_name: form.full_name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const data = await api(endpoint, { 
        method: 'POST', 
        body: JSON.stringify(payload) 
      });
      
      login(data);
      const next = params.get('next');
      const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : null;
      
      navigate(safeNext || (data.user.role === 'customer' ? '/' : '/staff'), { replace: true });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const handleDemoFill = (email, password) => {
    setForm({ ...form, email: email, password: password });
    setError('');
  };

  return (
    <div className="auth-split-page">
      <div className="auth-left-pane">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">{register ? 'Create an account' : 'Welcome Back!'}</h1>
            <p className="auth-subtitle">
              {register ? 'Sign up with your valid email and password.' : 'Sign in with your Email and Password.'}
            </p>
          </div>

          {error && (
            <div className="auth-status-banner" style={{ borderLeftColor: '#914c49', backgroundColor: '#f5e0dc', color: '#914c49' }} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {register && (
              <div className="auth-input-group">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="auth-pill-input"
                />
              </div>
            )}
            
            <div className="auth-input-group">
              <input
                type="email"
                required
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="auth-pill-input"
              />
            </div>

            <div className="auth-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="auth-pill-input auth-pill-input--password"
              />
              <button
                type="button"
                className="auth-eye-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {register && (
              <div className="auth-input-group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm Password"
                  value={form.confirm_password}
                  onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  className="auth-pill-input auth-pill-input--password"
                />
                <button
                  type="button"
                  className="auth-eye-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {!register && (
              <div className="auth-forgot-row">
                <a href="#forgot" className="auth-forgot-link" onClick={(e) => e.preventDefault()}>
                  Forgot Password?
                </a>
              </div>
            )}

            <button type="submit" className="auth-login-btn" disabled={saving}>
              {saving ? 'Please wait...' : register ? 'Sign Up' : 'Login'}
            </button>
          </form>

          <div className="auth-divider">
            <span>{register ? 'or sign up with' : 'or login with'}</span>
          </div>

          <div className="auth-social-group">
            <button type="button" className="auth-social-btn" onClick={() => alert('Google OAuth is a UI placeholder for the future.')}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
              </svg>
              <span>{register ? 'Sign up with Google' : 'Login with Google'}</span>
            </button>

            <button type="button" className="auth-social-btn" onClick={() => alert('Facebook OAuth is a UI placeholder for the future.')}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
              </svg>
              <span>{register ? 'Sign up with Facebook' : 'Login with Facebook'}</span>
            </button>
          </div>

          {!register && (
            <div className="auth-demo-section">
              <span className="auth-demo-label">Quick demo:</span>
              <div className="auth-demo-pills">
                <button type="button" className="auth-demo-pill" onClick={() => handleDemoFill('jamespeteratorejas@gmail.com', 'JAMESTOWN0411')}>
                  Customer
                </button>
                <button type="button" className="auth-demo-pill" onClick={() => handleDemoFill('staff@gmail.com', '#JAMES@0411')}>
                  Staff
                </button>
                <button type="button" className="auth-demo-pill" onClick={() => handleDemoFill('admin@gmail.com', '#JAMES@0411')}>
                  Admin
                </button>
              </div>
            </div>
          )}

          <p className="auth-footer-text">
            {register ? 'Already have an account?' : 'Did not have any account?'}{' '}
            <Link to={register ? '/login' : '/register'} className="auth-register-link">
              {register ? 'Login' : 'Register Now'}
            </Link>
          </p>
        </div>
      </div>

      <div className="auth-right-pane">
        <div className="auth-carousel">
          <img
            src={SHOWCASE_SLIDES[activeSlide].url}
            alt={SHOWCASE_SLIDES[activeSlide].alt}
            className="auth-carousel-image"
          />
          <div className="auth-carousel-overlay" />
          <div className="auth-carousel-dots" role="tablist" aria-label="Catering showcase">
            {SHOWCASE_SLIDES.map((slide, index) => (
              <button
                key={slide.alt}
                type="button"
                role="tab"
                aria-selected={activeSlide === index}
                aria-label={`View slide ${index + 1}`}
                className={`auth-carousel-dot ${activeSlide === index ? 'is-active' : ''}`}
                onClick={() => setActiveSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}