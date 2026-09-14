import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-[#55694A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-lg tracking-widest text-[#362B21] uppercase">
            Verifying Administrator Credentials...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Logged in but not an admin -> Access Restricted screen
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-[#B24C40]/10 text-[#B24C40] rounded-full flex items-center justify-center mx-auto border border-[#B24C40]/20">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#8F6E50] font-sans font-bold block">
              Authorization Required
            </span>
            <h1 className="font-serif text-2xl text-[#362B21] font-light">
              Restricted Portal
            </h1>
            <p className="text-xs text-[#544131]/80 font-sans leading-relaxed">
              Your account (<strong className="text-[#362B21]">{user?.email}</strong>) does not have administrative privileges for the Pottery Rugs admin portal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#DACDB3]">
            <Link
              to="/"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] text-xs uppercase tracking-wider rounded-lg font-sans font-medium transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Storefront</span>
            </Link>

            <button
              onClick={() => logout()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[#DACDB3] hover:bg-[#E2D8C3] text-[#4E3C2B] text-xs uppercase tracking-wider rounded-lg font-sans font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
