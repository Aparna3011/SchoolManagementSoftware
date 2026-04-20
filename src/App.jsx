import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import Fees from './pages/Fees';
import MasterSettings from './pages/MasterSettings';
import CompanyProfile from './pages/CompanyProfile';
import Attendance from './pages/Attendance';
// import AppToaster from "./components/ui/AppToaster";
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import AttendanceSettings from './pages/AttendanceSettings';

/**
 * App Root Component
 * 
 * Uses HashRouter (required for Electron file:// protocol).
 * Layout wraps all routes with sidebar navigation.
 */

export default function App() {
  return (
    <HashRouter>
     {/* <AppToaster /> */}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/master-settings" element={<MasterSettings />} />
          <Route path="/company-profile" element={<CompanyProfile />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:studentId" element={<StudentDetail />} />
          <Route path="/attendance-settings" element={<AttendanceSettings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
