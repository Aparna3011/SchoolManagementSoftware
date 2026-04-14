import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import Fees from './pages/Fees';
import MasterSettings from './pages/MasterSettings';
import CompanyProfile from './pages/CompanyProfile';

/**
 * App Root Component
 * 
 * Uses HashRouter (required for Electron file:// protocol).
 * Layout wraps all routes with sidebar navigation.
 */

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/master-settings" element={<MasterSettings />} />
          <Route path="/company-profile" element={<CompanyProfile />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
