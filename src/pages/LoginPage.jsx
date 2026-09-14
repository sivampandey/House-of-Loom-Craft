import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import SEO from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';
import { companyInfo } from '../data/carpets';

export default function LoginPage({ onShowToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectPath = location.state?.from?.pathname || '/profile';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (onShowToast) {
        onShowToast('cart', 'Welcome Back', res.message || 'Logged in successfully.');
      }
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-24 sm:pt-28 pb-16 flex items-center justify-center px-4 sm:px-6">
      <SEO
        title="Sign In | Pottery Rugs & Home Decor"
        description="Sign in to your Pottery Rugs & Home Decor account to view orders, saved items, and account details."
        path="/login"
      />

      <div className="w-full max-w-4xl bg-[#EFE8D8] rounded-3xl overflow-hidden border border-[#DACDB3] shadow-2xl grid grid-cols-1 md:grid-cols-12">
        {/* Left Side: Editorial Atmospheric Visual (5 cols) */}
        <div className="md:col-span-5 relative bg-[#3C4A34] min-h-[220px] md:min-h-[500px] overflow-hidden flex flex-col justify-between p-8 text-[#FAF7F0]">
          <img
            src="/images/craft-weaving.jpg"
            alt="Handcrafted Weaving"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#362B21]/95 via-[#45563D]/70 to-transparent" />

          {/* Top Mark */}
          <div className="relative z-10">
            <span className="text-[9px] uppercase tracking-[0.3em] text-[#D4BC9F] font-bold block">
              BHADOHI CRAFTSMANSHIP
            </span>
            <h2 className="font-serif text-2xl text-[#FAF7F0] mt-1 font-light">
              POTTERY RUGS
            </h2>
          </div>

          {/* Bottom Quote */}
          <div className="relative z-10 space-y-2">
            <p className="font-serif italic text-sm text-[#FAF7F0]/90 leading-relaxed">
              "A hand-knotted heirloom carries the spirit and quiet patience of the loom into the sanctuary of the home."
            </p>
            <div className="flex items-center gap-2 text-[10px] text-[#D4BC9F] uppercase tracking-wider font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Encrypted Secure Access</span>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form (7 cols) */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold">
                ACCOUNT
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light mt-1">
                Welcome Back
              </h1>
              <p className="text-xs text-[#4E3C2B] mt-1 font-sans">
                Enter your credentials to access your account and order history.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-900/10 border border-red-800/30 text-red-900 text-xs leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#55694A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email or phone"
                    className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-[#362B21] focus:outline-none transition-all placeholder-[#4E3C2B]/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#362B21] font-bold">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-[#55694A] hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#55694A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-[#362B21] focus:outline-none transition-all placeholder-[#4E3C2B]/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-md mt-2 disabled:opacity-50"
              >
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-[#DACDB3]/60 text-center space-y-2">
              <p className="text-xs text-[#4E3C2B]">
                New to POTTERY RUGS & HOME DECOR?{' '}
                <Link
                  to="/register"
                  className="font-bold text-[#55694A] hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
