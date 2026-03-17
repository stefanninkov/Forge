import { useTheme } from '@/hooks/use-theme';
import { Sun, Moon } from 'lucide-react';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const themes: { value: 'light' | 'dark'; label: string; icon: ComponentType<LucideProps> }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div className="flex flex-col" style={{ gap: 24 }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
          Theme
        </h3>
        <div className="flex" style={{ gap: 12 }}>
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  width: 120, padding: '16px 12px',
                  border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border-default)'}`,
                  borderRadius: 8, backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  transition: 'all var(--duration-fast)',
                }}
              >
                <Icon size={20} style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
