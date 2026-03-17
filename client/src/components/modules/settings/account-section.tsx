import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { FirebaseError } from 'firebase/app';

export function AccountSection() {
  const { user, updateName, updateEmail, updatePassword } = useAuth();
  const [name, setName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  async function handleUpdateAccount(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (name !== user?.displayName) await updateName(name);
      if (email !== user?.email) await updateEmail(email);
      toast.success('Account updated');
    } catch (err) {
      toast.error(err instanceof FirebaseError ? err.message : 'Failed to update account');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setChangingPw(true);
    try {
      await updatePassword(newPassword);
      toast.success('Password changed');
      setNewPassword('');
    } catch (err) {
      toast.error(err instanceof FirebaseError ? err.message : 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  }

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

  const labelStyle = {
    display: 'block' as const,
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 6,
  };

  return (
    <div className="flex flex-col" style={{ gap: 32 }}>
      {/* Profile */}
      <div>
        <h3
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}
        >
          Profile
        </h3>
        <form onSubmit={handleUpdateAccount}>
          <div className="flex flex-col" style={{ gap: 12 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
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
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            <div>
              <button
                type="submit"
                disabled={saving}
                style={{
                  height: 36,
                  padding: '0 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

      {/* Change password */}
      <div>
        <h3
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}
        >
          Change password
        </h3>
        <form onSubmit={handleChangePassword}>
          <div className="flex flex-col" style={{ gap: 12 }}>
            <div>
              <label style={labelStyle}>New password</label>
              <input
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
            <div>
              <button
                type="submit"
                disabled={changingPw || newPassword.length < 8}
                style={{
                  height: 36,
                  padding: '0 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  cursor: changingPw ? 'not-allowed' : 'pointer',
                  opacity: changingPw || newPassword.length < 8 ? 0.5 : 1,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {changingPw ? 'Changing...' : 'Change password'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
