import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, LayoutDashboard, Users, Briefcase, CheckSquare, UserCircle, Menu, X, Users2, DollarSign, FileText, Calendar, CreditCard, Package, MessageSquare, Store, Lock, Bell } from 'lucide-react';
import { useState } from 'react';
import { Badge } from './ui/Badge';
import NotificationBell from './NotificationBell';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const getNavItems = () => {
    const isTeamMember = user?.role === 'Developer' || user?.role === 'Project Manager';
    const isClient = user?.role === 'Client';
    
    if (isClient) {
      return [
        { path: '/client-portal', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/client-portal/projects', label: 'Projects', icon: Briefcase },
        { path: '/client-portal/tasks', label: 'Tasks', icon: CheckSquare },
        { path: '/client-portal/payments', label: 'Payments', icon: DollarSign },
        { path: '/client-portal/requirements', label: 'Requirements', icon: FileText },
        { path: '/client-portal/settings', label: 'Settings', icon: Lock },
      ];
    }
    
    if (isTeamMember) {
      const items = [
        { path: '/team-member/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { path: '/tasks', label: 'My Tasks', icon: CheckSquare },
        { path: '/leave-requests', label: 'Leave Requests', icon: Calendar },
        { path: '/payment-requests', label: 'Payment Requests', icon: CreditCard },
        { path: '/general-requests', label: 'Requests', icon: Package },
        { path: '/chat', label: 'Chat', icon: MessageSquare },
      ];
      
      // Add Projects for Project Managers
      if (user?.role === 'Project Manager') {
        items.splice(2, 0, { path: '/projects', label: 'Projects', icon: Briefcase });
      }
      
      return items;
    }
    
    return [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/leads', label: 'Leads', icon: UserCircle },
      { path: '/clients', label: 'Clients', icon: Users },
      { path: '/projects', label: 'Projects', icon: Briefcase },
      { path: '/tasks', label: 'Tasks', icon: CheckSquare },
      { path: '/requirements', label: 'Requirements', icon: FileText },
      { path: '/teams', label: 'Teams', icon: Users2 },
      { path: '/payments', label: 'Payments', icon: DollarSign },
      { path: '/password-vault', label: 'Password Vault', icon: Lock },
      { path: '/expenses', label: 'Expenses', icon: DollarSign },
      { path: '/vendors', label: 'Vendors', icon: Store },
      { path: '/attendance', label: 'Attendance', icon: Calendar },
      { path: '/payroll', label: 'Payroll', icon: CreditCard },
      { path: '/inventory', label: 'Inventory', icon: Package },
      { path: '/assets', label: 'Assets', icon: Package },
      { path: '/financial-reports', label: 'Financial Reports', icon: FileText },
      { path: '/activity-logs', label: 'Activity Logs', icon: FileText },
      { path: '/chat', label: 'Chat', icon: MessageSquare },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-screen z-40`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <Link to={user?.role === 'Client' ? '/client-portal' : '/dashboard'} className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ProjectHub
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
                  }`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                    <Badge variant="info" className="text-xs mt-1">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Mobile Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 lg:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-64 h-full bg-white shadow-xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ProjectHub
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="py-4">
                <div className="space-y-1 px-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive(item.path)
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <Badge variant="info" className="text-xs mt-1">
                        {user?.role}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
