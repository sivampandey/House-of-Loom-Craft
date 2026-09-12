import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import SEO from '../components/common/SEO';
import { authAPI } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [demoToken, setDemoToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await authAPI.forgotPassword(email);
      setMessage(res.message || 'Password recovery instructions dispatched.');
      if (res.resetToken) {
        setDemoToken(res.resetToken);
      }
    } catch (err) {
      setError(err.message || 'Unable to process reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-28 sm:pt-32 pb-20 flex items-center justify-center px-4">
      <SEO
        title="Password Recovery | Private Atelier"
        description="Reset your client account access credentials for Pottery Rugs & Home Decor."
        path="/forgot-password"
      />

      <div className="w-full max-w-lg bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-8 sm:p-12 shadow-xl space-y-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#55694A] font-bold hover:text-[#362B21] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </Link>

        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold">
            SECURITY ASSISTANCE
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light mt-1">
            Reset Password
          </h1>
          <p className="text-xs text-[#4E3C2B] mt-1">
            Enter your registered email or phone to generate a secure reset authorization.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-900/10 border border-red-800/30 text-red-900 text-xs">
            {error}
          </div>
        )}

        {message ? (
          <div className="space-y-4 p-6 bg-[#FAF7F0] rounded-2xl border border-[#DACDB3]">
            <div className="flex items-center gap-2.5 text-[#55694A]">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-serif text-lg font-medium text-[#362B21]">Request Processed</h3>
            </div>
            <p className="text-xs text-[#4E3C2B] leading-relaxed">
              {message}
            </p>

            {demoToken && (
              <div className="p-3 bg-[#E5DCB8]/60 rounded-xl border border-[#DACDB3] space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-[#55694A] font-bold block">
                  Development Reset Token:
                </span>
                <code className="text-xs font-mono text-[#362B21] break-all block bg-[#FAF7F0] p-2 rounded">
                  {demoToken}
                </code>
                <Link
                  to={`/reset-password?token=${demoToken}`}
                  className="inline-block text-xs font-bold text-[#55694A] hover:underline"
                >
                  Proceed to Reset Password →
                </Link>
              </div>
            )}
          </div>
        ) : (
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
                  placeholder="Enter email"
                  className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-[#362B21] focus:outline-none placeholder-[#4E3C2B]/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : 'Send Reset Instructions'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
