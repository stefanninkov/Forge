import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header
      className="sticky top-0 z-10 shrink-0"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '16px 24px',
          width: '100%',
        }}
      >
        <div>
          <h1
            className="font-semibold"
            style={{
              fontSize: 'var(--text-lg)',
              lineHeight: 'var(--leading-tight)',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              style={{
                fontSize: 'var(--text-sm)',
                lineHeight: 'var(--leading-normal)',
                color: 'var(--text-secondary)',
                margin: '4px 0 0',
              }}
            >
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center" style={{ gap: 8 }}>
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
