import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Database,
  ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/users', label: 'Customers', icon: Users },
  { path: '/admin/offers', label: 'Offers & Coupons', icon: Tag },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Dynamically set noindex meta tag for search engine privacy
  useEffect(() => {
    let metaTag = document.querySelector('meta[name="robots"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'robots';
      document.head.appendChild(metaTag);
    }
    metaTag.content = 'noindex, nofollow';

    return () => {
      // Restore when leaving admin routes
      if (metaTag) {
        metaTag.content = 'index, follow';
      }
    };
  }, []);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1E261B] flex flex-col antialiased selection:bg-[#55694A]/20">
      {/* ================= TOP APPLICATION HEADER ================= */}
      <header className="sticky top-0 z-40 bg-[#F5F0E6]/95 backdrop-blur-md border-b border-[#DACDB3] px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile Drawer Button */}
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="lg:hidden p-2 rounded-lg border border-[#DACDB3] text-[#362B21] hover:bg-[#EAE2D2] transition-colors"
            aria-label="Toggle navigation drawer"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo & Brand Identity */}
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#4C5D41] text-[#FAF7F0] flex items-center justify-center font-serif font-bold text-xs shadow-sm border border-[#6D7F62]/40">
              HLC
            </div>
            <div>
              <span className="font-serif text-sm sm:text-base tracking-wider uppercase font-medium text-[#362B21] block leading-tight">
                House of Loom & Craft
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#55694A] font-sans font-bold block">
                Admin Console
              </span>
            </div>
          </Link>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Real Live Database Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFE8D8] border border-[#DACDB3] text-xs text-[#4E3C2B]">
            <Database className="w-3.5 h-3.5 text-[#55694A]" />
            <span className="text-[11px] font-mono font-medium">pottery_rugs</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Database Connected" />
          </div>

          {/* View Storefront Link */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DACDB3] text-xs text-[#362B21] hover:bg-[#EAE2D2] transition-colors font-sans font-medium"
            title="Open customer storefront in a new tab"
          >
            <span className="hidden sm:inline">View Store</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#55694A]" />
          </Link>

          {/* Admin Account & Sign Out */}
          <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-[#DACDB3]">
            <div className="hidden md:block text-right">
              <span className="text-xs font-serif text-[#362B21] font-medium block leading-tight">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] text-[#55694A] font-mono block">
                {user?.email}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg border border-[#DACDB3] text-[#B24C40] hover:bg-[#B24C40]/10 transition-colors"
              title="Sign Out of Admin Portal"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT & SIDEBAR ================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP FIXED SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-64 bg-[#EFE8D8] border-r border-[#DACDB3] shrink-0 justify-between">
          <div className="p-4 space-y-1">
            <span className="text-[9.5px] uppercase tracking-[0.25em] text-[#8F6E50] font-sans font-bold px-3 py-2 block">
              Store Management
            </span>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-sans transition-all duration-200 ${
                    isActive
                      ? 'bg-[#4C5D41] text-[#FAF7F0] font-bold shadow-sm border border-[#6D7F62]/50 translate-x-1'
                      : 'text-[#4E3C2B] hover:bg-[#E2D8C3] hover:text-[#1E261B] font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4BC9F]' : 'text-[#55694A]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#D4BC9F]" />}
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer Details */}
          <div className="p-4 border-t border-[#DACDB3] bg-[#E8DFD0]/50 space-y-2 text-[11px] font-sans text-[#4E3C2B]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-[#8F6E50] font-bold">System Status</span>
              <span className="text-[10px] text-emerald-700 font-medium">Production Online</span>
            </div>
            <p className="text-[10px] text-[#544131]/75 leading-relaxed">
              Store & Inventory Management System &bull; v2.0
            </p>
          </div>
        </aside>

        {/* MOBILE DRAWER OVERLAY */}
        {mobileDrawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden animate-fadeIn"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <div
              className="w-72 max-w-[80vw] h-full bg-[#EFE8D8] border-r border-[#DACDB3] p-5 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#DACDB3]">
                  <span className="font-serif text-base text-[#362B21] font-medium">
                    Admin Navigation
                  </span>
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-[#362B21] hover:bg-[#E2D8C3]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-sans transition-colors ${
                          isActive
                            ? 'bg-[#4C5D41] text-[#FAF7F0] font-bold shadow-sm'
                            : 'text-[#4E3C2B] hover:bg-[#E2D8C3] font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#D4BC9F]" />}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#DACDB3] text-xs text-[#4E3C2B] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-mono">pottery_rugs live</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#B24C40]/10 text-[#B24C40] rounded-lg text-xs uppercase tracking-wider font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= CHILD PAGE VIEWPORT ================= */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#FAF7F0]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
