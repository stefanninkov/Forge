import type { CSSProperties } from 'react';

export const guideStyles = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  } as CSSProperties,

  h2: {
    fontSize: 'var(--text-lg)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '8px 0 0',
    lineHeight: 1.4,
    fontFamily: 'var(--font-sans)',
  } as CSSProperties,

  h3: {
    fontSize: 'var(--text-md)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '4px 0 0',
    lineHeight: 1.4,
    fontFamily: 'var(--font-sans)',
  } as CSSProperties,

  p: {
    fontSize: 'var(--text-base)',
    lineHeight: 1.7,
    color: 'var(--text-secondary)',
    margin: 0,
  } as CSSProperties,

  code: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-xs)',
    backgroundColor: 'var(--bg-secondary)',
    padding: '2px 6px',
    borderRadius: 4,
    color: 'var(--text-primary)',
  } as CSSProperties,

  codeBlock: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-xs)',
    lineHeight: 1.6,
    backgroundColor: 'var(--bg-secondary)',
    padding: '16px 20px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-default)',
    overflowX: 'auto',
    margin: 0,
    color: 'var(--text-primary)',
    whiteSpace: 'pre',
  } as CSSProperties,

  ol: {
    fontSize: 'var(--text-base)',
    lineHeight: 1.7,
    color: 'var(--text-secondary)',
    margin: 0,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  } as CSSProperties,

  ul: {
    fontSize: 'var(--text-base)',
    lineHeight: 1.7,
    color: 'var(--text-secondary)',
    margin: 0,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  } as CSSProperties,

  tip: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent-subtle)',
    borderLeft: '3px solid var(--accent)',
    fontSize: 'var(--text-sm)',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  } as CSSProperties,

  note: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-secondary)',
    borderLeft: '3px solid var(--border-emphasis)',
    fontSize: 'var(--text-sm)',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  } as CSSProperties,

  warning: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'color-mix(in srgb, var(--amber) 8%, transparent)',
    borderLeft: '3px solid var(--amber)',
    fontSize: 'var(--text-sm)',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  } as CSSProperties,

  calloutLabel: {
    fontWeight: 600,
    fontSize: 'var(--text-xs)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 4,
    color: 'var(--text-primary)',
  } as CSSProperties,

  divider: {
    border: 'none',
    borderTop: '1px solid var(--border-default)',
    margin: '8px 0',
  } as CSSProperties,
} as const;
