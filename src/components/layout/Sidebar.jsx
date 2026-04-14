import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  IndianRupee,
  Settings,
  Building2,
} from 'lucide-react';

/**
 * Sidebar Component
 * 
 * Fixed navigation sidebar with school branding and nav links.
 */

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/registration', label: 'Registration', icon: UserPlus },
  { to: '/fees', label: 'Fees', icon: IndianRupee },
  { to: '/master-settings', label: 'Master Settings', icon: Settings },
  { to: '/company-profile', label: 'Company Profile', icon: Building2 },
];

export function Sidebar() {
  return (
    <aside className="app-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">R</div>
        <div>
          <div className="sidebar-brand-text">Rainbow Play School</div>
          <div className="sidebar-brand-sub">Management System</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-text">
          © {new Date().getFullYear()} S V IT Hub
        </div>
      </div>
    </aside>
  );
}
