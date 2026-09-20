import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User, Phone, ShieldCheck } from 'lucide-react';
import SEO from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage({ onShowToast }) {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters in length.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });

      if (onShowToast) {
        onShowToast('cart', 'Welcome', res.message || 'Account created successfully.');
      }

      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-24 sm:pt-28 pb-16 flex items-center justify-center px-4 sm:px-6">
      <SEO
        title="Create Account | House of Loom & Craft"
        description="Create an account to track your orders, manage shipping addresses, and save favorite rugs."
        path="/register"
      />

      <div className="w-full max-w-4xl bg-[#EFE8D8] rounded-3xl overflow-hidden border border-[#DACDB3] shadow-2xl grid grid-cols-1 md:grid-cols-12">
        {/* Left Side: Atmospheric Craft Visual (5 cols) */}
        <div className="md:col-span-5 relative bg-[#3C4A34] min-h-[220px] md:min-h-[560px] overflow-hidden flex flex-col justify-between p-8 text-[#FAF7F0]">
          <img
            src="/images/bespoke-atelier.jpg"
            alt="Bhadohi Handcrafting"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#362B21]/95 via-[#45563D]/70 to-transparent" />

          <div className="relative z-10">
            <span className="text-[9px] uppercase tracking-[0.3em] text-[#D4BC9F] font-bold block">
              ACCOUNT BENEFITS
            </span>
            <h2 className="font-serif text-2xl text-[#FAF7F0] mt-1 font-light">
              Join House of Loom & Craft
            </h2>
          </div>

          <div className="relative z-10 space-y-2">
            <p className="font-serif italic text-sm text-[#FAF7F0]/90 leading-relaxed">
              "Enjoy insured shipping, order tracking updates, and curated collections for your home."
            </p>
            <div className="flex items-center gap-2 text-[10px] text-[#D4BC9F] uppercase tracking-wider font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Securely Protected Customer Data</span>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form (7 cols) */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold">
                SIGN UP
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light mt-1">
                Create Account
              </h1>
              <p className="text-xs text-[#4E3C2B] mt-1 font-sans">
                Register to track orders and save your favorite pieces.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-900/10 border border-red-800/30 text-red-900 text-xs leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#55694A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter first name"
                      className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 pl-10 pr-3 text-xs sm:text-sm text-[#362B21] focus:outline-none placeholder-[#4E3C2B]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 px-3.5 text-xs sm:text-sm text-[#362B21] focus:outline-none placeholder-[#4E3C2B]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#55694A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-[#362B21] focus:outline-none placeholder-[#4E3C2B]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#55694A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-[#362B21] focus:outline-none placeholder-[#4E3C2B]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#55694A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 pl-10 pr-3 text-xs sm:text-sm text-[#362B21] focus:outline-none placeholder-[#4E3C2B]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 px-3.5 text-xs sm:text-sm text-[#362B21] focus:outline-none placeholder-[#4E3C2B]/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-md mt-4 disabled:opacity-50"
              >
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-[#DACDB3]/60 text-center">
              <p className="text-xs text-[#4E3C2B]">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#55694A] hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
