import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function AuthForm({ mode }) {
  const register = mode === 'register';
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = await api(`/auth/${register ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(form) });
      login(data);
      const next = params.get('next');
      const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : null;
      navigate(safeNext || (data.user.role === 'customer' ? '/my-bookings' : '/staff'), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return <section className="shell auth-layout"><div className="auth-story"><span className="eyebrow green">WELCOME TO CATEREASE</span><h2>Great memories start with a great plan.</h2><p>We'll keep the event details organized, so you can focus on the celebration.</p><div className="story-art">✿</div></div>
    <div className="form-card auth-card"><span className="eyebrow green">{register ? 'JOIN THE CELEBRATION' : 'GOOD TO SEE YOU'}</span><h1>{register ? 'Create your account' : 'Welcome back.'}</h1><p className="muted">{register ? 'Start planning your next occasion.' : 'Log in to manage your catering bookings.'}</p>
      {error && <p className="notice warning" role="alert">{error}</p>}
      <form onSubmit={submit} className="form-stack">
        {register && <label>Full name<input required minLength={2} maxLength={120} autoComplete="name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" /></label>}
        <label>Email address<input required type="email" autoComplete="email" maxLength={255} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
        <label>Password<input required type="password" minLength={register ? 8 : undefined} autoComplete={register ? 'new-password' : 'current-password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimum 8 characters" /></label>
        <button disabled={saving} className="button full" type="submit">{saving ? 'Please wait...' : register ? 'Create account ↗' : 'Log in ↗'}</button>
      </form>
      <p className="auth-switch">{register ? 'Already registered?' : 'New to CaterEase?'} <Link to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></p>
    </div>
  </section>;
}
