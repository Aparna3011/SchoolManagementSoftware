import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

/**
 * Layout Component
 * 
 * App shell with sidebar + main content area.
 * Uses react-router Outlet for page rendering.
 */

export function Layout() {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50 relative">
        <div className="p-8 max-w-[1400px] mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
