import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './contexts/ToastContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Teams from './pages/Teams';
import ActivityLogs from './pages/ActivityLogs';
import Payments from './pages/Payments';
import TeamMemberDashboard from './pages/TeamMemberDashboard';
import LeaveRequests from './pages/LeaveRequests';
import PaymentRequests from './pages/PaymentRequests';
import GeneralRequests from './pages/GeneralRequests';
import Chat from './pages/Chat';
import ProjectDetail from './pages/ProjectDetail';
import Expenses from './pages/Expenses';
import Vendors from './pages/Vendors';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import Inventory from './pages/Inventory';
import Assets from './pages/Assets';
import FinancialReports from './pages/FinancialReports';
import PasswordVault from './pages/PasswordVault';
import Requirements from './pages/Requirements';
import Layout from './components/Layout';
import ClientDashboard from './pages/ClientPortal/ClientDashboard';
import ClientProjects from './pages/ClientPortal/ClientProjects';
import ClientProjectDetail from './pages/ClientPortal/ClientProjectDetail';
import ClientTasks from './pages/ClientPortal/ClientTasks';
import ClientPayments from './pages/ClientPortal/ClientPayments';
import ClientRequirements from './pages/ClientPortal/ClientRequirements';
import ClientSettings from './pages/ClientPortal/ClientSettings';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function ClientRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'Client') return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="clients" element={<Clients />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="teams" element={<Teams />} />
            <Route path="payments" element={<Payments />} />
            <Route path="password-vault" element={<PasswordVault />} />
            <Route path="requirements" element={<Requirements />} />
            <Route path="activity-logs" element={<ActivityLogs />} />
            <Route path="team-member/dashboard" element={<TeamMemberDashboard />} />
            <Route path="leave-requests" element={<LeaveRequests />} />
            <Route path="payment-requests" element={<PaymentRequests />} />
                    <Route path="general-requests" element={<GeneralRequests />} />
                    <Route path="chat" element={<Chat />} />
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="vendors" element={<Vendors />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="payroll" element={<Payroll />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="assets" element={<Assets />} />
                    <Route path="financial-reports" element={<FinancialReports />} />
                  </Route>

                  {/* Client Portal Routes */}
                  <Route
                    path="/client-portal"
                    element={
                      <ClientRoute>
                        <Layout />
                      </ClientRoute>
                    }
                  >
                    <Route index element={<ClientDashboard />} />
                    <Route path="projects" element={<ClientProjects />} />
                    <Route path="projects/:id" element={<ClientProjectDetail />} />
                    <Route path="tasks" element={<ClientTasks />} />
                    <Route path="payments" element={<ClientPayments />} />
                    <Route path="requirements" element={<ClientRequirements />} />
                    <Route path="settings" element={<ClientSettings />} />
                  </Route>
                </Routes>
              </Router>
            </ToastProvider>
          );
        }

        export default App;

