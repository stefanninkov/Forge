import { useState, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api, ApiError } from '@/lib/api';
import { usePageTitle } from '@/hooks/use-page-title';
import { CheckCircle2 } from 'lucide-react';

const inputStyle = {
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
};

export default function ResetPasswordPage() {
  usePageTitle('Reset Password');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to reset password. The link may have expired.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}
      >
        <div style={{ width: '100%', maxWidth: 400, padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Invalid or missing reset token.
          </p>
          <Link to="/forgot-password" style={{
            fontSize: 'var(--text-sm)', fontWeight: 500,
            color: 'var(--accent-text)', textDecoration: 'none',
          }}>
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}
    >
      <div style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        {/* Logo */}
        <div className="flex items-center justify-center" style={{ marginBottom: 32 }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 32, height: 32,
                backgroundColor: 'var(--accent)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 'var(--text-base)' }}>F</span>
            </div>
            <span style={{
              fontSize: 'var(--text-lg)', fontWeight: 600,
              color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)',
            }}>
              Forge
            </span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
        }}>
          {success ? (
            <div className="flex flex-col items-center" style={{ gap: 12, padding: '8px 0' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--accent)' }} />
              <h1 style={{
                fontSize: 'var(--text-md)', fontWeight: 600,
                color: 'var(--text-primary)',
              }}>
                Password reset
              </h1>
              <p style={{
                fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textAlign: 'center',
              }}>
                Your password has been updated. Redirecting to sign in...
              </p>
            </div>
          ) : (
            <>
              <h1 style={{
                fontSize: 'var(--text-md)', fontWeight: 600,
                color: 'var(--text-primary)', marginBottom: 4,
              }}>
                Set new password
              </h1>
              <p style={{
                fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 20,
              }}>
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="new-password" style={{
                    display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500,
                    color: 'var(--text-secondary)', marginBottom: 6,
                  }}>
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                    Must be at least 8 characters.
                  </p>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label htmlFor="confirm-password" style={{
                    display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500,
                    color: 'var(--text-secondary)', marginBottom: 6,
                  }}>
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    style={inputStyle}
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
                  <p style={{
                    fontSize: 'var(--text-sm)', color: 'var(--error)', marginBottom: 16,
                  }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', height: 36,
                    border: 'none', borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent)', color: '#fff',
                    fontSize: 'var(--text-sm)', fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
