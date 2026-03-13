import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-elevated)',
        },
      }}
      offset={16}
      gap={8}
    />
  );
}
