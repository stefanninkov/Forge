import { useEffect } from 'react';

/** Sets the document title with "Forge" suffix. Restores on unmount. */
export function usePageTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — Forge` : 'Forge';
    return () => {
      document.title = prev;
    };
  }, [title]);
}
