import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  User, Package, Heart, MapPin, Shield, LogOut,
  Edit3, Plus, Trash2, CheckCircle2, AlertCircle,
  Sparkles, Check, Phone, Mail, ArrowRight
} from 'lucide-react';
import SEO from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';
import { usersAPI, authAPI, ordersAPI } from '../services/api';

export default function ProfilePage({ onShowToast }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout, updateProfile, refreshUser } = useAuth();

  const tabParam = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabParam);

  // Sync tab with URL query parameter
  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'overview');
  }, [searchParams]);

  const setTab = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || ''
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Uttar Pradesh',
    postalCode: '',
    country: 'India',
    landmark: '',
    isDefault: false
  });
  const [addressSaving, setAddressSaving] = useState(false);

  // Security Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });

  // Recent Orders State for overview
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
      });
      setAddresses(user.addresses || []);
    }
  }, [user]);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const res = await ordersAPI.getOrders();
        if (res.success && res.orders) {
          setRecentOrders(res.orders.slice(0, 3));
        }
      } catch (e) { }
    };
    fetchRecentOrders();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile(profileForm);
      if (onShowToast) {
        onShowToast('cart', 'Profile Updated', 'Personal details saved successfully.');
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast('error', 'Error', err.message);
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const openAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      phone: user?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: 'Uttar Pradesh',
      postalCode: '',
      country: 'India',
      landmark: '',
      isDefault: addresses.length === 0
    });
    setShowAddressModal(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country || 'India',
      landmark: addr.landmark || '',
      isDefault: addr.isDefault || false
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressSaving(true);
    try {
      if (editingAddressId) {
        const res = await usersAPI.updateAddress(editingAddressId, addressForm);
        if (res.success) {
          setAddresses(res.addresses);
          setShowAddressModal(false);
          await refreshUser();
          if (onShowToast) onShowToast('cart', 'Address Saved', 'Address updated successfully.');
        }
      } else {
        const res = await usersAPI.addAddress(addressForm);
        if (res.success) {
          setAddresses(res.addresses);
          setShowAddressModal(false);
          await refreshUser();
          if (onShowToast) onShowToast('cart', 'Address Added', 'Address added successfully.');
        }
      }
    } catch (err) {
      if (onShowToast) onShowToast('error', 'Error', err.message);
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Remove this address from your profile?')) return;
    try {
      const res = await usersAPI.deleteAddress(id);
      if (res.success) {
        setAddresses(res.addresses);
        await refreshUser();
        if (onShowToast) onShowToast('cart', 'Address Removed', 'Address removed successfully.');
      }
    } catch (err) {
      if (onShowToast) onShowToast('error', 'Error', err.message);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const res = await usersAPI.setDefaultAddress(id);
      if (res.success) {
        setAddresses(res.addresses);
        await refreshUser();
        if (onShowToast) onShowToast('cart', 'Default Updated', 'Primary delivery address set.');
      }
    } catch (err) {
      if (onShowToast) onShowToast('error', 'Error', err.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSecurityMessage({ type: '', text: '' });

    if (passwordForm.newPassword.length < 8) {
      setSecurityMessage({ type: 'error', text: 'New password must be at least 8 characters in length.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setSecurityMessage({ type: 'success', text: res.message || 'Password changed successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      if (onShowToast) onShowToast('cart', 'Security Updated', 'Password updated successfully.');
    } catch (err) {
      setSecurityMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-28 sm:pt-32 pb-24">
      <SEO
        title="My Profile | House of Loom & Craft"
        description="Manage your account, orders, and saved addresses."
        path="/profile"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[#DACDB3] mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-[2px] bg-[#6D7F62]" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
                MY ACCOUNT
              </span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#362B21] font-light">
              My Profile
            </h1>
            <p className="text-xs text-[#4E3C2B]">
              Welcome, <strong className="text-[#362B21]">{user?.firstName} {user?.lastName}</strong>. Manage your orders and saved addresses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#45563D] text-[#FAF7F0] font-sans font-bold border border-[#85977A]/40 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4BC9F]" />
              Verified Customer
            </span>
          </div>
        </div>

        {/* Profile Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Navigation (4 cols) */}
          <aside className="lg:col-span-4 bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-6 space-y-2 shadow-sm">
            <div className="p-4 border-b border-[#DACDB3]/70 mb-2 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#55694A] text-[#FAF7F0] flex items-center justify-center font-serif text-xl font-bold border border-[#85977A]/60">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="font-serif text-lg text-[#362B21] font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-[#4E3C2B] truncate font-sans">
                  {user?.email}
                </p>
              </div>
            </div>

            <nav className="space-y-1 text-xs uppercase tracking-wider font-sans font-bold">
              <button
                onClick={() => setTab('overview')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between ${activeTab === 'overview'
                  ? 'bg-[#55694A] text-[#FAF7F0] shadow-sm'
                  : 'text-[#362B21] hover:bg-[#E5DCB8]/60'
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4" />
                  Account Overview
                </span>
              </button>

              <Link
                to="/orders"
                className="w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between text-[#362B21] hover:bg-[#E5DCB8]/60"
              >
                <span className="flex items-center gap-2.5">
                  <Package className="w-4 h-4" />
                  Order History & Timeline
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <button
                onClick={() => setTab('addresses')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between ${activeTab === 'addresses'
                  ? 'bg-[#55694A] text-[#FAF7F0] shadow-sm'
                  : 'text-[#362B21] hover:bg-[#E5DCB8]/60'
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4" />
                  Saved Addresses ({addresses.length})
                </span>
              </button>

              <button
                onClick={() => setTab('personal')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between ${activeTab === 'personal'
                  ? 'bg-[#55694A] text-[#FAF7F0] shadow-sm'
                  : 'text-[#362B21] hover:bg-[#E5DCB8]/60'
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <User className="w-4 h-4" />
                  Personal Information
                </span>
              </button>

              <button
                onClick={() => setTab('security')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between ${activeTab === 'security'
                  ? 'bg-[#55694A] text-[#FAF7F0] shadow-sm'
                  : 'text-[#362B21] hover:bg-[#E5DCB8]/60'
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4" />
                  Security & Password
                </span>
              </button>

              <div className="pt-4 border-t border-[#DACDB3]/70 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-xl text-red-900 hover:bg-red-900/10 transition-colors flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </nav>
          </aside>

          {/* Right Content Area (8 cols) */}
          <main className="lg:col-span-8 bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-8 sm:p-12 shadow-sm min-h-[500px]">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold">
                    SUMMARY
                  </span>
                  <h2 className="font-serif text-3xl text-[#362B21] font-light mt-1">
                    Account Overview
                  </h2>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#DACDB3] space-y-1">
                    <span className="text-xs uppercase tracking-wider text-[#4E3C2B]/70 block font-sans">
                      Total Orders
                    </span>
                    <span className="font-serif text-3xl text-[#362B21] font-medium block">
                      {recentOrders.length}
                    </span>
                    <Link to="/orders" className="text-[11px] text-[#55694A] hover:underline font-bold inline-block pt-1">
                      View Order History →
                    </Link>
                  </div>

                  <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#DACDB3] space-y-1">
                    <span className="text-xs uppercase tracking-wider text-[#4E3C2B]/70 block font-sans">
                      Saved Addresses
                    </span>
                    <span className="font-serif text-3xl text-[#362B21] font-medium block">
                      {addresses.length}
                    </span>
                    <button onClick={() => setTab('addresses')} className="text-[11px] text-[#55694A] hover:underline font-bold inline-block pt-1">
                      Manage Addresses →
                    </button>
                  </div>

                  <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#DACDB3] space-y-1">
                    <span className="text-xs uppercase tracking-wider text-[#4E3C2B]/70 block font-sans">
                      Account Status
                    </span>
                    <span className="font-serif text-xl text-[#55694A] font-medium block pt-1">
                      Active Customer
                    </span>
                    <span className="text-[10px] text-[#4E3C2B]/70 block">
                      Insured shipping included
                    </span>
                  </div>
                </div>

                {/* Default Delivery Address Preview */}
                <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#DACDB3] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl text-[#362B21] font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#55694A]" />
                      Default Shipping Address
                    </h3>
                    <button
                      onClick={() => setTab('addresses')}
                      className="text-xs uppercase tracking-wider text-[#55694A] font-bold hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  {defaultAddr ? (
                    <div className="text-xs text-[#4E3C2B] space-y-1 leading-relaxed">
                      <p className="font-bold text-[#362B21]">{defaultAddr.fullName} ({defaultAddr.phone})</p>
                      <p>{defaultAddr.addressLine1} {defaultAddr.addressLine2}</p>
                      <p>{defaultAddr.city}, {defaultAddr.state} - {defaultAddr.postalCode}</p>
                      <p>{defaultAddr.country}</p>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs text-[#4E3C2B] mb-2">No delivery address saved yet.</p>
                      <button
                        onClick={openAddAddress}
                        className="text-xs uppercase tracking-widest font-bold text-[#55694A] underline"
                      >
                        Add Default Address
                      </button>
                    </div>
                  )}
                </div>

                {/* Recent Orders Snippet */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-2xl text-[#362B21] font-light">Recent Orders</h3>
                    <Link to="/orders" className="text-xs uppercase tracking-wider text-[#55694A] font-bold hover:underline">
                      View All
                    </Link>
                  </div>

                  {recentOrders.length === 0 ? (
                    <div className="p-8 text-center bg-[#FAF7F0] rounded-2xl border border-[#DACDB3] space-y-2">
                      <p className="font-serif text-lg text-[#362B21]">No orders placed yet</p>
                      <p className="text-xs text-[#4E3C2B]">When you place an order, your delivery status will be visible here.</p>
                      <Link to="/collections" className="inline-block mt-2 text-xs uppercase tracking-widest font-bold text-[#55694A] underline">
                        Explore Collections
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map(order => (
                        <Link
                          key={order._id}
                          to={`/orders/${order.orderNumber || order._id}`}
                          className="block p-4 rounded-xl bg-[#FAF7F0] border border-[#DACDB3] hover:border-[#55694A] transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold font-mono text-[#362B21]">{order.orderNumber}</span>
                              <span className="text-[#4E3C2B] ml-3">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <span className="uppercase tracking-wider font-bold text-[10px] px-2.5 py-0.5 rounded-full bg-[#55694A]/10 text-[#55694A]">
                              {order.orderStatus}
                            </span>
                          </div>
                          <div className="mt-2 text-xs flex justify-between text-[#4E3C2B]">
                            <span>{order.items?.length || 0} Piece(s)</span>
                            <span className="font-bold text-[#362B21]">₹{(order.total || 0).toLocaleString()}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold">
                      DELIVERY DESTINATIONS
                    </span>
                    <h2 className="font-serif text-3xl text-[#362B21] font-light mt-1">
                      Saved Addresses
                    </h2>
                  </div>
                  <button
                    onClick={openAddAddress}
                    className="px-5 py-2.5 bg-[#55694A] text-[#FAF7F0] rounded-full text-xs uppercase tracking-wider font-sans font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#6D8262] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="p-12 text-center bg-[#FAF7F0] rounded-2xl border border-[#DACDB3] space-y-3">
                    <MapPin className="w-8 h-8 text-[#55694A] mx-auto opacity-70" />
                    <p className="font-serif text-xl text-[#362B21]">No Addresses on File</p>
                    <p className="text-xs text-[#4E3C2B] max-w-sm mx-auto">
                      Add your primary delivery address to ensure seamless shipping upon checkout.
                    </p>
                    <button
                      onClick={openAddAddress}
                      className="mt-2 px-6 py-2.5 bg-[#55694A] text-[#FAF7F0] text-xs uppercase tracking-wider font-bold rounded-full"
                    >
                      Add Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                      <div
                        key={addr._id}
                        className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${addr.isDefault
                          ? 'bg-[#FAF7F0] border-[#55694A] shadow-md'
                          : 'bg-[#FAF7F0]/70 border-[#DACDB3]'
                          }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#362B21]">{addr.fullName}</span>
                            {addr.isDefault ? (
                              <span className="text-[9px] uppercase tracking-wider bg-[#55694A] text-[#FAF7F0] px-2.5 py-0.5 rounded-full font-bold">
                                Default
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSetDefaultAddress(addr._id)}
                                className="text-[10px] uppercase tracking-wider text-[#55694A] hover:underline font-bold"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-[#4E3C2B] flex items-center gap-1.5 font-mono">
                            <Phone className="w-3 h-3 text-[#55694A]" /> {addr.phone}
                          </p>

                          <div className="text-xs text-[#4E3C2B] leading-relaxed pt-1">
                            <p>{addr.addressLine1}</p>
                            {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                            <p>{addr.city}, {addr.state} - {addr.postalCode}</p>
                            <p>{addr.country}</p>
                            {addr.landmark && <p className="italic text-[11px] text-[#55694A]">Landmark: {addr.landmark}</p>}
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-[#DACDB3]/60 flex items-center justify-end gap-3 text-xs font-bold">
                          <button
                            onClick={() => openEditAddress(addr)}
                            className="text-[#55694A] hover:text-[#362B21] flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            className="text-red-800/80 hover:text-red-950 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PERSONAL INFORMATION */}
            {activeTab === 'personal' && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold">
                    ACCOUNT DETAILS
                  </span>
                  <h2 className="font-serif text-3xl text-[#362B21] font-light mt-1">
                    Personal Information
                  </h2>
                  <p className="text-xs text-[#4E3C2B] mt-1">
                    Update your profile information. Your email address is linked to your order history.
                  </p>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 px-3.5 text-xs sm:text-sm text-[#362B21] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 px-3.5 text-xs sm:text-sm text-[#362B21] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
                      Email Address (Read-Only)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full bg-[#E5DCB8]/40 border border-[#DACDB3] rounded-xl py-3 px-3.5 text-xs sm:text-sm text-[#4E3C2B] opacity-80 cursor-not-allowed"
                    />
                    <span className="text-[10px] text-[#55694A] block mt-1">
                      To change your email address, please contact customer support.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 7460007382"
                      className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 px-3.5 text-xs sm:text-sm text-[#362B21] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-8 py-3.5 bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-all mt-2 disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: SECURITY & ACCESS */}
            {activeTab === 'security' && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold">
                    PASSWORD & SECURITY
                  </span>
                  <h2 className="font-serif text-3xl text-[#362B21] font-light mt-1">
                    Security & Password
                  </h2>
                  <p className="text-xs text-[#4E3C2B] mt-1">
                    Update your password to keep your account secure.
                  </p>
                </div>

                {securityMessage.text && (
                  <div
                    className={`p-4 rounded-xl text-xs flex items-center gap-2 ${securityMessage.type === 'success'
                      ? 'bg-[#55694A]/10 text-[#55694A] border border-[#55694A]/30'
                      : 'bg-red-900/10 text-red-900 border border-red-800/30'
                      }`}
                  >
                    {securityMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{securityMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 px-3.5 text-xs sm:text-sm text-[#362B21] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
                      New Password (Min 8 characters)
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 px-3.5 text-xs sm:text-sm text-[#362B21] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#362B21] font-bold mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full bg-[#FAF7F0] border border-[#DACDB3] focus:border-[#55694A] rounded-xl py-3 px-3.5 text-xs sm:text-sm text-[#362B21] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="px-8 py-3.5 bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-all mt-2 disabled:opacity-50"
                  >
                    {passwordSaving ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>

                <div className="pt-6 border-t border-[#DACDB3]/70">
                  <h4 className="font-serif text-lg text-[#362B21] mb-2">Account Session</h4>
                  <p className="text-xs text-[#4E3C2B] mb-4">
                    Sign out of your account on this device.
                  </p>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2.5 rounded-xl border border-red-800/40 text-red-900 hover:bg-red-900/10 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Address Edit/Add Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DACDB3]/70 pb-4">
              <h3 className="font-serif text-2xl text-[#362B21]">
                {editingAddressId ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-xs uppercase tracking-wider font-bold text-[#4E3C2B] hover:text-[#362B21]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider font-bold mb-1">Address Line 1</label>
                <input
                  type="text"
                  required
                  placeholder="Apartment, suite, unit, villa number"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                  className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-bold mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  placeholder="Street, locality, area"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                  className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block uppercase tracking-wider font-bold mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider font-bold mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider font-bold mb-1">PIN / Postal</label>
                  <input
                    type="text"
                    required
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block uppercase tracking-wider font-bold mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={addressForm.landmark}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
                    className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider font-bold mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={addressForm.country}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="rounded text-[#55694A] focus:ring-0"
                  />
                  <span className="font-bold uppercase tracking-wider text-[11px]">Set as default shipping address</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#DACDB3] text-[#4E3C2B] font-bold uppercase tracking-wider hover:bg-[#FAF7F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] font-bold uppercase tracking-wider shadow-sm disabled:opacity-50"
                >
                  {addressSaving ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
