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
    <aside className="w-[260px] min-w-[260px] h-screen bg-slate-900 flex flex-col overflow-hidden relative z-10 text-slate-300 shadow-xl">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-md">
          R
        </div>
        <div>
          <div className="text-white text-sm font-semibold leading-tight tracking-wide">School Management System</div>
          <div className="text-slate-400 text-xs font-normal mt-0.5">Management System</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 outline-none ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="text-slate-500 text-xs font-medium tracking-wide">
          © {new Date().getFullYear()} S V IT Hub
        </div>
      </div>
    </aside>
  );
}
