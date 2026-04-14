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
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="page-container animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
