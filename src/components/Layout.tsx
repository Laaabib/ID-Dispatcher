import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAdminNotifications } from '../hooks/useAdminNotifications';
import { Button } from '../components/ui/button';
import { LogOut, Shield, User as UserIcon, Badge as BadgeIcon, LayoutDashboard, Sun, Moon, Menu, BarChart2, CheckCircle2, Package, Users, Calendar, FileText, X, ChevronLeft, ChevronRight } from 'lucide-react';
import AIAssistant from './AIAssistant';
import logoImg from '../assets/Logo.svg';

const NavItem = ({ to, icon: Icon, children, onClick, isCollapsed }: { to: string, icon: any, children: React.ReactNode, onClick?: () => void, isCollapsed?: boolean }) => (
  <NavLink
    to={to}
    onClick={onClick}
    title={isCollapsed ? children as string : undefined}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
        isActive
          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      } ${isCollapsed ? 'justify-center' : ''}`
    }
  >
    <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
    {!isCollapsed && <span className="truncate">{children}</span>}
  </NavLink>
);

export default function Layout() {
  const { user, role, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize admin notifications
  useAdminNotifications();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isAdmin = ['admin', 'admin_approver', 'it_approver'].includes(role || '');
  const isSpecialUser = user?.email === '140001@padmaawt.internal' || user?.email === 'padmaawtit@gmail.com';

  const NavLinks = ({ onClick, isCollapsed }: { onClick?: () => void, isCollapsed?: boolean }) => (
    <>
      {isAdmin && (
        <>
          <NavItem to="/admin-dashboard" icon={LayoutDashboard} onClick={onClick} isCollapsed={isCollapsed}>Dashboard</NavItem>
          <NavItem to="/admin" icon={Shield} onClick={onClick} isCollapsed={isCollapsed}>ID Cards</NavItem>
          <NavItem to="/nametag-admin" icon={BadgeIcon} onClick={onClick} isCollapsed={isCollapsed}>Nametags</NavItem>
          <NavItem to="/employees" icon={Users} onClick={onClick} isCollapsed={isCollapsed}>Employees</NavItem>
        </>
      )}
      <NavItem to="/attendance" icon={Calendar} onClick={onClick} isCollapsed={isCollapsed}>Attendance</NavItem>
      <NavItem to="/reports" icon={BarChart2} onClick={onClick} isCollapsed={isCollapsed}>Reports</NavItem>
      
      {isSpecialUser && (
        <>
          <NavItem to="/daily-works" icon={CheckCircle2} onClick={onClick} isCollapsed={isCollapsed}>Daily Works</NavItem>
          <NavItem to="/inventory" icon={Package} onClick={onClick} isCollapsed={isCollapsed}>Inventory</NavItem>
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl flex flex-col transition-transform duration-300 ease-in-out transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
            <Link to="/" className="flex items-center transition-all duration-200 hover:opacity-80 hover:scale-105" onClick={() => setMobileMenuOpen(false)}>
              <img src={logoImg} alt="Padma id Manager" className="h-10 w-auto object-contain drop-shadow-sm" />
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:scale-110 active:scale-95 transition-all">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <NavLinks onClick={() => setMobileMenuOpen(false)} />
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium px-3 py-3 mb-2">
              <UserIcon className="w-4 h-4 text-primary-500 dark:text-primary-400" />
              <span className="truncate">{user?.displayName}</span>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-5 h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-110 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all z-40 flex items-center justify-center"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" /> : <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
        </Button>

        <div className={`h-16 flex items-center border-b border-slate-200 dark:border-slate-800 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
          <Link to="/" className="flex items-center transition-all duration-200 hover:opacity-80 hover:scale-105">
            <img src={logoImg} alt="Padma id Manager" className={`${isCollapsed ? 'h-8' : 'h-10'} w-auto object-contain drop-shadow-sm transition-all duration-300`} />
          </Link>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden">
          <NavLinks isCollapsed={isCollapsed} />
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          {!isCollapsed && (
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium px-3 py-3 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg transition-all duration-300">
              <UserIcon className="w-4 h-4 text-primary-500 dark:text-primary-400 flex-shrink-0" />
              <span className="truncate">{user?.displayName}</span>
            </div>
          )}
          <Button variant="ghost" onClick={handleLogout} title={isCollapsed ? "Logout" : undefined} className={`w-full gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}>
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300">
          <div className="flex items-center lg:hidden">
            <Link to="/" className="flex items-center transition-all duration-200 hover:opacity-80 hover:scale-105">
              <img src={logoImg} alt="Padma id Manager" className="h-10 w-auto object-contain drop-shadow-sm" />
            </Link>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <div className="lg:hidden">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all">
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto transition-all duration-300">
          <Outlet />
        </main>
      </div>
      
      <AIAssistant />
    </div>
  );
}
