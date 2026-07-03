import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAdminNotifications } from '../hooks/useAdminNotifications';
import { Button } from '../components/ui/button';
import { LogOut, Shield, User as UserIcon, Badge as BadgeIcon, LayoutDashboard, Sun, Moon, Menu, BarChart2, CheckCircle2, Package, Users, Calendar, FileText, X, ChevronLeft, ChevronRight, ChevronDown, Bell, Eye, Briefcase, Palette, Activity } from 'lucide-react';
import AIAssistant from './AIAssistant';
import logoImg from '../assets/Logo.svg';

const NavItem = ({ to, icon: Icon, children, onClick, isCollapsed, className = '' }: { to: string, icon: any, children: React.ReactNode, onClick?: () => void, isCollapsed?: boolean, className?: string }) => (
  <NavLink
    to={to}
    onClick={onClick}
    title={isCollapsed ? children as string : undefined}
    className={({ isActive }) =>
      `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 ${
        isActive
          ? 'bg-primary-50/80 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm border border-primary-100 dark:border-primary-800/50 backdrop-blur-md'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:shadow-sm border border-transparent backdrop-blur-sm'
      } ${isCollapsed ? 'justify-center' : ''} ${className}`
    }
  >
    <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${isCollapsed ? 'mx-auto' : ''}`} />
    {!isCollapsed && <span className="truncate">{children}</span>}
  </NavLink>
);

const NavSection = ({ title, icon: Icon, children, isCollapsed, defaultExpanded = false }: any) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (isCollapsed) {
    return (
      <div className="space-y-1 mt-4 first:mt-0">
        <div className="flex justify-center text-slate-400 dark:text-slate-500 py-2" title={title}>
          <Icon className="w-5 h-5 opacity-50" />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="mt-2 first:mt-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/30' : ''}`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="uppercase tracking-wider text-[10.5px]">{title}</span>
        </div>
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-1 pl-3 border-l-2 border-slate-100 dark:border-slate-800 ml-5 pt-1 pb-2">
          {children}
        </div>
      </div>
    </div>
  );
};

const NavLinksDesktopMobile = ({ onClick, isCollapsed, isAdmin, role, isSpecialUser }: { onClick?: () => void, isCollapsed?: boolean, isAdmin: boolean, role: string | null | undefined, isSpecialUser: boolean }) => (
  <div className="space-y-1 pb-4">
    {/* Workspace / Self Service */}
    <NavSection title="Workspace" icon={LayoutDashboard} isCollapsed={isCollapsed} defaultExpanded={true}>
      <NavItem to="/" icon={LayoutDashboard} onClick={onClick} isCollapsed={isCollapsed}>My Dashboard</NavItem>
      <NavItem to="/apply" icon={BadgeIcon} onClick={onClick} isCollapsed={isCollapsed}>Request ID Card</NavItem>
      <NavItem to="/nametag-request" icon={FileText} onClick={onClick} isCollapsed={isCollapsed}>Request Nametag</NavItem>
      <NavItem to="/leave" icon={Calendar} onClick={onClick} isCollapsed={isCollapsed}>Apply Leave</NavItem>
      {isSpecialUser && (
        <NavItem to="/daily-works" icon={Briefcase} onClick={onClick} isCollapsed={isCollapsed}>Daily Works</NavItem>
      )}
    </NavSection>

    {/* HR & Personnel */}
    {(isAdmin || role === 'hr_manager') && (
      <NavSection title="HR & Personnel" icon={Users} isCollapsed={isCollapsed} defaultExpanded={false}>
        <NavItem to="/hr" icon={Briefcase} onClick={onClick} isCollapsed={isCollapsed}>HR Dashboard</NavItem>
        <NavItem to="/employees" icon={Users} onClick={onClick} isCollapsed={isCollapsed}>Employee Management</NavItem>
        <NavItem to="/departments" icon={Users} onClick={onClick} isCollapsed={isCollapsed}>Department</NavItem>
        <NavItem to="/designations" icon={BadgeIcon} onClick={onClick} isCollapsed={isCollapsed}>Designation</NavItem>
        <NavItem to="/trainees" icon={BadgeIcon} onClick={onClick} isCollapsed={isCollapsed}>Trainee Management</NavItem>
        <NavItem to="/employee-id-generation" icon={FileText} onClick={onClick} isCollapsed={isCollapsed}>ID Num Distribution</NavItem>
        <NavItem to="/attendance" icon={CheckCircle2} onClick={onClick} isCollapsed={isCollapsed}>Attendance</NavItem>
        <NavItem to="/admin" icon={BadgeIcon} onClick={onClick} isCollapsed={isCollapsed}>ID Cards</NavItem>
        <NavItem to="/nametag-admin" icon={FileText} onClick={onClick} isCollapsed={isCollapsed}>Nametags</NavItem>
        <NavItem to="/leave-admin" icon={Calendar} onClick={onClick} isCollapsed={isCollapsed}>Leave Requests</NavItem>
      </NavSection>
    )}

    {/* Administration */}
    {isAdmin && (
      <NavSection title="Administration" icon={Shield} isCollapsed={isCollapsed} defaultExpanded={false}>
        <NavItem to="/admin-dashboard" icon={Shield} onClick={onClick} isCollapsed={isCollapsed}>Admin Dashboard</NavItem>
        {role === 'admin' && (
          <NavItem to="/users" icon={UserIcon} onClick={onClick} isCollapsed={isCollapsed}>User Roles</NavItem>
        )}
        <NavItem to="/activity-log" icon={Activity} onClick={onClick} isCollapsed={isCollapsed}>Activity Log</NavItem>
      </NavSection>
    )}

    {/* Operations & Reports */}
    {(isSpecialUser || isAdmin || role === 'inventory_manager') && (
      <NavSection title="Operations" icon={Package} isCollapsed={isCollapsed} defaultExpanded={false}>
        {(isSpecialUser || role === 'admin' || role === 'inventory_manager') && (
          <NavItem to="/inventory" icon={Package} onClick={onClick} isCollapsed={isCollapsed}>Inventory Management</NavItem>
        )}
        {isAdmin && (
          <NavItem to="/reports" icon={BarChart2} onClick={onClick} isCollapsed={isCollapsed}>Analytics & Reports</NavItem>
        )}
      </NavSection>
    )}
  </div>
);

export default function Layout() {
  const { user, role, logout } = useAuth();
  const { theme, setTheme, colorblind, setColorblind, accentColor, setAccentColor } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  // Initialize admin notifications
  const { unreadCount, recentNotifications } = useAdminNotifications() || { unreadCount: 0, recentNotifications: [] };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleColorblind = () => {
    setColorblind(!colorblind);
  };

  const isAdmin = ['admin', 'admin_approver', 'it_approver'].includes(role || '');
  const isSpecialUser = user?.email === '140001@padmaawt.internal' || user?.email === 'padmaawtit@gmail.com';

      // Removed duplicate NavLinks declaration here

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl flex flex-col transition-transform duration-300 ease-in-out transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
            <Link to="/" className="flex items-center gap-3 transition-all duration-200 hover:opacity-80" onClick={() => setMobileMenuOpen(false)}>
              <img src={logoImg} alt="Padma AWT Rest House ERP System" className="h-8 w-auto object-contain drop-shadow-sm" />
              <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                Padma AWT<br/>Rest House
              </span>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:scale-110 active:scale-95 transition-all">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <NavLinksDesktopMobile onClick={() => setMobileMenuOpen(false)} isAdmin={isAdmin} role={role} isSpecialUser={isSpecialUser} />
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
      <aside className={`hidden lg:flex flex-col fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30 transition-all duration-300 ease-in-out print:hidden ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-5 h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-110 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all z-40 flex items-center justify-center"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" /> : <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
        </Button>

        <div className={`h-16 flex items-center border-b border-slate-200 dark:border-slate-800 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
          <Link to="/" className="flex items-center gap-3 transition-all duration-200 hover:opacity-80">
            <img src={logoImg} alt="Padma AWT Rest House ERP System" className={`${isCollapsed ? 'h-8' : 'h-10'} w-auto object-contain drop-shadow-sm transition-all duration-300`} />
            {!isCollapsed && (
              <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                Padma AWT<br/>Rest House
              </span>
            )}
          </Link>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden">
          <NavLinksDesktopMobile isCollapsed={isCollapsed} isAdmin={isAdmin} role={role} isSpecialUser={isSpecialUser} />
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
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'} print:!pl-0`}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300 print:hidden">
          <div className="flex items-center lg:hidden">
            <Link to="/" className="flex items-center gap-3 transition-all duration-200 hover:opacity-80">
              <img src={logoImg} alt="Padma id Manager" className="h-8 w-auto object-contain drop-shadow-sm" />
              <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                Padma AWT<br/>Rest House
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {isAdmin && (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all" 
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
                
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 z-50 overflow-hidden flex flex-col max-h-[80vh]">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Recent Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 text-xs px-2 py-1 rounded-full font-medium">
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                      <div className="overflow-y-auto flex-1 p-2">
                        {recentNotifications.length > 0 ? (
                          <div className="space-y-1">
                            {recentNotifications.map(notif => (
                              <div key={notif.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer" onClick={() => {
                                setShowNotifications(false);
                                navigate('/admin-dashboard');
                              }}>
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-full flex-shrink-0 ${notif.type === 'id_card' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                    {notif.type === 'id_card' ? <FileText className="w-4 h-4" /> : <BadgeIcon className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                      New {notif.type === 'id_card' ? 'ID Card' : 'Nametag'} Request
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      From: {notif.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                      {new Date(notif.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                            <CheckCircle2 className="w-8 h-8 mb-2 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm">You're all caught up!</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <Button 
                          variant="ghost" 
                          className="w-full text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                          onClick={() => {
                            setShowNotifications(false);
                            navigate('/admin-dashboard');
                          }}
                        >
                          View Dashboard
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={toggleColorblind} title="Toggle Colorblind Mode" className={`rounded-full hover:scale-110 active:scale-95 transition-all ${colorblind ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Eye className="h-5 w-5 transition-transform duration-300 hover:scale-110" />
            </Button>
            
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setShowPalette(!showPalette)} title="Change Theme Color" className="rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all">
                <Palette className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
              </Button>
              {showPalette && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPalette(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 z-50 p-2 overflow-hidden flex flex-col gap-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-1 mb-1">Theme Colors</p>
                    <button onClick={() => { setAccentColor('default'); setShowPalette(false); }} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${accentColor === 'default' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300'}`}>
                      <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Default
                    </button>
                    <button onClick={() => { setAccentColor('bd-army'); setShowPalette(false); }} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${accentColor === 'bd-army' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300'}`}>
                      <span className="w-3 h-3 rounded-full bg-[#4b5320]"></span> BD Army
                    </button>
                    <button onClick={() => { setAccentColor('ocean'); setShowPalette(false); }} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${accentColor === 'ocean' ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' : 'hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300'}`}>
                      <span className="w-3 h-3 rounded-full bg-cyan-500"></span> Ocean
                    </button>
                    <button onClick={() => { setAccentColor('crimson'); setShowPalette(false); }} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${accentColor === 'crimson' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300'}`}>
                      <span className="w-3 h-3 rounded-full bg-rose-600"></span> Crimson
                    </button>
                  </div>
                </>
              )}
            </div>

            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle Theme" className="rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all">
              {theme === 'dark' ? <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-90" /> : <Moon className="h-5 w-5 transition-transform duration-300 hover:-rotate-12" />}
            </Button>
            <div className="lg:hidden">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all">
                <Menu className="h-6 w-6 transition-transform duration-300 hover:scale-110" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full mx-auto transition-all duration-300 print:!p-0 print:!m-0">
          <Outlet />
        </main>
      </div>
      
      <div className="print:hidden">
        <AIAssistant />
      </div>
    </div>
  );
}
