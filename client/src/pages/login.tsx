import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { usePageTitle } from '@/hooks/use-page-title';

interface AuthResponse {
  user: { id: string; email: string; name: string };
  accessToken: string;
  refreshToken: string;
}

export default function LoginPage() {
  usePageTitle('Log in');
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post<AuthResponse>('/auth/login', { email, password });
      localStorage.setItem('forge-refresh-token', data.refreshToken);
      setAuth(data.user, data.accessToken);
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex items-center justify-center"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          padding: 32,
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center" style={{ marginBottom: 32 }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                backgroundColor: 'var(--accent)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 'var(--text-base)' }}>
                F
              </span>
            </div>
            <span
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              Forge
            </span>
          </div>
        </div>

        {/* Form card */}
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
          }}
        >
          <h1
            style={{
              fontSize: 'var(--text-md)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            Sign in
          </h1>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 20,
            }}
          >
            Enter your credentials to continue.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 12px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-primary)',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                placeholder="you@example.com"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 12px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-primary)',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {error && (
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--error)',
                  marginBottom: 16,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 36,
                border: 'none',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                fontFamily: 'var(--font-sans)',
                transition: 'background-color var(--duration-fast)',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p
          className="text-center"
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            marginTop: 16,
          }}
        >
          No account?{' '}
          <Link
            to="/register"
            style={{
              color: 'var(--accent-text)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
