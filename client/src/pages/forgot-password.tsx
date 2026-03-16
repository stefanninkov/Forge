import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { usePageTitle } from '@/hooks/use-page-title';
import { ArrowLeft } from 'lucide-react';

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

export default function ForgotPasswordPage() {
  usePageTitle('Forgot Password');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } catch {
      // Silently ignore — don't reveal if email exists
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
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
          {submitted ? (
            <>
              <h1 style={{
                fontSize: 'var(--text-md)', fontWeight: 600,
                color: 'var(--text-primary)', marginBottom: 8,
              }}>
                Check your email
              </h1>
              <p style={{
                fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
                marginBottom: 20, lineHeight: 'var(--leading-normal)',
              }}>
                If an account with <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> exists,
                you will receive a password reset link.
              </p>
              <Link
                to="/login"
                className="flex items-center"
                style={{
                  gap: 6, fontSize: 'var(--text-sm)', fontWeight: 500,
                  color: 'var(--accent-text)', textDecoration: 'none',
                }}
              >
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 style={{
                fontSize: 'var(--text-md)', fontWeight: 600,
                color: 'var(--text-primary)', marginBottom: 4,
              }}>
                Reset password
              </h1>
              <p style={{
                fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
                marginBottom: 20,
              }}>
                Enter your email address and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label htmlFor="email" style={{
                    display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500,
                    color: 'var(--text-secondary)', marginBottom: 6,
                  }}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
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
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>

        {!submitted && (
          <p className="text-center" style={{
            fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 16,
          }}>
            <Link to="/login" style={{
              color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 500,
            }}>
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
