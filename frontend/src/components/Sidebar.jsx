import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calculator, 
  MessageCircle, 
  FolderOpen,
  Settings,
  LogOut,
  Users,
  BarChart3,
  ChevronRight,
  Stethoscope
} from 'lucide-react';
import { cn, fetchApi } from '../lib/utils';

const studentLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/curriculum', label: 'Course Curriculum', icon: BookOpen },
  { href: '/tools', label: 'Interactive Tools', icon: Calculator },
  { href: '/chat', label: 'AI Assistant', icon: MessageCircle },
  { href: '/resources', label: 'Resources', icon: FolderOpen },
];

const adminLinks = [
  { href: '/admin', label: 'Admin Dashboard', icon: BarChart3 },
  { href: '/admin/content', label: 'Content Management', icon: BookOpen },
  { href: '/admin/users', label: 'User Management', icon: Users },
];

export function Sidebar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.role === 'instructor';

  const handleLogout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/');
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-primary glass-dark flex flex-col z-50" data-testid="sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-heading font-bold text-lg leading-tight">GCC Medical</h1>
            <p className="text-white/60 text-xs">Launch Academy</p>
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{user?.name || 'Student'}</p>
            <p className="text-white/60 text-xs capitalize">{user?.role || 'student'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {studentLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'sidebar-link',
                location.pathname === link.href && 'active'
              )}
              data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
              {location.pathname === link.href && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </Link>
          ))}
        </div>

        {isAdmin && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3 px-4">Admin</p>
            <div className="space-y-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'sidebar-link',
                    location.pathname === link.href && 'active'
                  )}
                  data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <link.icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10 space-y-1">
        <Link to="/settings" className="sidebar-link" data-testid="nav-settings">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-left hover:text-red-300"
          data-testid="logout-btn"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export function DashboardLayout({ children, user }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user} />
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
