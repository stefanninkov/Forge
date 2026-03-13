import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/sidebar';

export function AppLayout() {
  return (
    <div className="flex" style={{ height: '100vh' }}>
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <Outlet />
      </main>
    </div>
  );
}
