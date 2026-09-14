import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import SEO from '../components/common/SEO';
import { authAPI } from '../services/api';

export default function ResetPasswordPage({ onShowToast }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('A valid reset authorization token is required.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.resetPassword({ token: token.trim(), newPassword });
      if (onShowToast) {
        onShowToast('cart', 'Password Updated', res.message || 'New password saved securely.');
      }
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to reset password. The token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-28 sm:pt-32 pb-20 flex items-center justify-center px-4">
      <SEO
        title="Set New Password | Pottery Rugs & Home Decor"
        description="Choose a new secure password for your account."
        path="/reset-password"
      />

      <div className="w-full max-w-md bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-8 sm:p-10 shadow-xl space-y-6">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold">
            ACCOUNT SECURITY
          </span>
          <h1 className="font-serif text-3xl text-[#362B21] font-light mt-1">
            New Password
          </h1>
          <p className="text-xs text-[#4E3C2B] mt-1">
            Choose a strong password with at least 8 characters.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-900/10 border border-red-800/30 text-red-900 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
              Reset Token
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token received"
              className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-2.5 px-3.5 text-xs font-mono text-[#362B21] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#55694A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-[#362B21] focus:outline-none placeholder-[#4E3C2B]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type password"
              className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 px-3.5 text-xs sm:text-sm text-[#362B21] focus:outline-none placeholder-[#4E3C2B]/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Saving Password...' : 'Save New Password'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link to="/login" className="text-xs text-[#55694A] hover:underline font-bold">
            Cancel & Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
