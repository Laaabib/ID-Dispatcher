import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { LogOut, Shield, User as UserIcon, Badge as BadgeIcon, LayoutDashboard, Sun, Moon, Menu, BarChart2 } from 'lucide-react';
import AIAssistant from './AIAssistant';
import logoImg from '../assets/logo.png';

export default function Layout() {
  const { user, role, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-transparent flex flex-col relative font-sans transition-colors duration-300">
      <header className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200/60 dark:border-white/10 sticky top-0 z-20 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-primary-600 dark:text-primary-400 flex items-center gap-3 transition-opacity hover:opacity-80">
                <img src={logoImg} alt="Padma id Manager" className="h-9 w-9 object-contain drop-shadow-sm" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }} />
                <span className="tracking-tight text-slate-900 dark:text-white"><span style={{ fontFamily: '"Brush Script MT", cursive', fontSize: '1.4em', fontWeight: 'normal' }} className="text-primary-600 dark:text-primary-400">Padma</span> id Manager</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {['admin', 'admin_approver', 'it_approver'].includes(role || '') && (
                <>
                  <Link to="/admin-dashboard">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-700 dark:text-slate-300">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Button>
                  </Link>
              {role === 'admin' && (
                  <Link to="/reports">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-700 dark:text-slate-300">
                      <BarChart2 className="w-4 h-4" />
                      <span>Reports</span>
                    </Button>
                  </Link>
              )}
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-700 dark:text-slate-300">
                      <Shield className="w-4 h-4" />
                      <span>ID Cards</span>
                    </Button>
                  </Link>
                  <Link to="/nametag-admin">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-700 dark:text-slate-300">
                      <BadgeIcon className="w-4 h-4" />
                      <span>Nametags</span>
                    </Button>
                  </Link>
                </>
              )}
              
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
              
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium bg-slate-100/50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-white/10">
                <UserIcon className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                <span>{user?.displayName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/30 dark:hover:text-red-400 dark:hover:border-red-800 transition-colors">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex md:hidden items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg">
            <div className="px-4 pt-2 pb-4 space-y-1">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium px-3 py-3 border-b border-slate-100 dark:border-white/5 mb-2">
                <UserIcon className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                <span className="truncate">{user?.displayName}</span>
              </div>
              
              {['admin', 'admin_approver', 'it_approver'].includes(role || '') && (
                <>
                  <Link to="/admin-dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-700 dark:text-slate-300">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
              {role === 'admin' && (
                  <Link to="/reports" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-700 dark:text-slate-300">
                      <BarChart2 className="w-4 h-4" />
                      Reports
                    </Button>
                  </Link>
              )}
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-700 dark:text-slate-300">
                      <Shield className="w-4 h-4" />
                      ID Cards
                    </Button>
                  </Link>
                  <Link to="/nametag-admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-700 dark:text-slate-300">
                      <BadgeIcon className="w-4 h-4" />
                      Nametags
                    </Button>
                  </Link>
                </>
              )}
              
              <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 mt-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <AIAssistant />
    </div>
  );
}
