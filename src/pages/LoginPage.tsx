import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in → go to dashboard
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Small artificial delay so the spinner is visible
    await new Promise(r => setTimeout(r, 400));
    const result = login(form.username, form.password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error ?? '');
    }
  };

  return (
    <div className="login_page">
      <div className="login_card">
        <div className="login_brand">
          <span className="login_logo" aria-hidden="true">₿</span>
          <h1 className="login_title">Binance 2.0</h1>
          <p className="login_subtitle">Accede a tu panel de mercado</p>
        </div>

        <form className="login_form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field_label" htmlFor="username">Usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              className="field_input"
              placeholder="admin"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label className="field_label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              className="field_input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="login_error" role="alert">{error}</p>}

          <button
            type="submit"
            className="login_btn"
            disabled={loading || !form.username || !form.password}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="login_hint">
          Demo: <code>admin</code> / <code>admin123</code>
        </p>
      </div>
    </div>
  );
}
