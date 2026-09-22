import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  User, Package, Heart, MapPin, Shield, LogOut,
  Edit3, Plus, Trash2, CheckCircle2, AlertCircle,
  Sparkles, Check, Phone, Mail, ArrowRight,
  MessageSquareQuote, LifeBuoy, Clock, Send, Image,
  RefreshCw, X, ChevronRight, MessageCircle, FileText
} from 'lucide-react';
import SEO from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';
import { usersAPI, authAPI, ordersAPI, supportAPI } from '../services/api';

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

  // Support Tickets State
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetailLoading, setTicketDetailLoading] = useState(false);
  const [showNewComplaintModal, setShowNewComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    category: 'Damaged Product',
    priority: 'Normal',
    orderNumber: '',
    subject: '',
    customerMessage: '',
    phone: '',
    whatsapp: '',
    attachmentUrl: ''
  });
  const [complaintSaving, setComplaintSaving] = useState(false);
  const [customerReplyText, setCustomerReplyText] = useState('');
  const [customerReplyAttachment, setCustomerReplyAttachment] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [allUserOrders, setAllUserOrders] = useState([]);

  const fetchMyTickets = async () => {
    setTicketsLoading(true);
    setTicketsError('');
    try {
      const res = await supportAPI.getMyTickets();
      if (res?.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      setTicketsError(err.message || 'Failed to load support tickets.');
    } finally {
      setTicketsLoading(false);
    }
  };

  const openTicketDetail = async (ticketId) => {
    setTicketDetailLoading(true);
    try {
      const res = await supportAPI.getTicketById(ticketId);
      if (res?.success) {
        setSelectedTicket(res.ticket);
      }
    } catch (err) {
      if (onShowToast) onShowToast('error', 'Error', err.message);
      else alert(err.message);
    } finally {
      setTicketDetailLoading(false);
    }
  };

  const handleSendCustomerReply = async (e) => {
    e.preventDefault();
    if (!customerReplyText.trim() || !selectedTicket || replySubmitting) return;
    setReplySubmitting(true);
    try {
      const attachments = customerReplyAttachment.trim() ? [{ url: customerReplyAttachment.trim(), name: 'Customer Photo' }] : [];
      const res = await supportAPI.addTicketMessage(selectedTicket.ticketId, {
        message: customerReplyText.trim(),
        attachments
      });
      if (res?.success) {
        setSelectedTicket(prev => ({
          ...prev,
          status: res.status,
          messages: res.messages,
          timeline: res.timeline
        }));
        setTickets(prev => prev.map(t => t.ticketId === selectedTicket.ticketId ? { ...t, status: res.status, updatedAt: new Date() } : t));
        setCustomerReplyText('');
        setCustomerReplyAttachment('');
        if (onShowToast) onShowToast('cart', 'Reply Sent', 'Your message was added to this ticket.');
      }
    } catch (err) {
      if (onShowToast) onShowToast('error', 'Error', err.message);
      else alert(err.message);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.customerMessage.trim() || complaintSaving) return;
    setComplaintSaving(true);
    try {
      const attachments = complaintForm.attachmentUrl.trim() ? [{ url: complaintForm.attachmentUrl.trim(), name: 'Customer Photo' }] : [];
      const res = await supportAPI.createTicket({
        ...complaintForm,
        attachments
      });
      if (res?.success) {
        if (onShowToast) onShowToast('cart', 'Ticket Created', `Support Ticket ${res.ticketId} has been registered.`);
        setShowNewComplaintModal(false);
        setComplaintForm({
          category: 'Damaged Product',
          priority: 'Normal',
          orderNumber: '',
          subject: '',
          customerMessage: '',
          phone: user?.phone || '',
          whatsapp: user?.phone || '',
          attachmentUrl: ''
        });
        await fetchMyTickets();
        if (res.ticketId) {
          openTicketDetail(res.ticketId);
        }
      }
    } catch (err) {
      if (onShowToast) onShowToast('error', 'Error', err.message);
      else alert(err.message);
    } finally {
      setComplaintSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
      });
      setAddresses(user.addresses || []);
      setComplaintForm(prev => ({
        ...prev,
        phone: user.phone || '',
        whatsapp: user.phone || ''
      }));
      fetchMyTickets();
      ordersAPI.getOrders().then(res => {
        if (res?.success && res.orders) {
          setAllUserOrders(res.orders);
          setRecentOrders(res.orders.slice(0, 3));
        }
      }).catch(() => {});
    }
  }, [user]);

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
                onClick={() => setTab('support')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between ${
                  activeTab === 'support' || activeTab === 'complaints'
                    ? 'bg-[#55694A] text-[#FAF7F0] shadow-sm'
                    : 'text-[#362B21] hover:bg-[#E5DCB8]/60'
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <MessageSquareQuote className="w-4 h-4" />
                  My Complaints & Tickets
                </span>
                {tickets.length > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      activeTab === 'support' || activeTab === 'complaints'
                        ? 'bg-white/20 text-white'
                        : 'bg-[#DACDB3] text-[#362B21]'
                    }`}
                  >
                    {tickets.length}
                  </span>
                )}
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

            {/* TAB 5: MY COMPLAINTS / SUPPORT TICKETS */}
            {(activeTab === 'support' || activeTab === 'complaints') && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DACDB3]/70 pb-5">
                  <div>
                    <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold">
                      ATELIER ASSISTANCE
                    </span>
                    <h3 className="font-serif text-2xl text-[#362B21] mt-1">
                      My Complaints & Support Tickets
                    </h3>
                    <p className="text-xs text-[#4E3C2B] font-sans mt-0.5">
                      Review submitted cases, damage evaluations, order inquiries, and live atelier resolutions.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchMyTickets}
                      title="Refresh Tickets"
                      className="p-2.5 bg-[#FAF7F0] border border-[#DACDB3] hover:bg-[#EFE8D8] text-[#362B21] rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${ticketsLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => setShowNewComplaintModal(true)}
                      className="px-4 py-2.5 bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      File a Complaint
                    </button>
                  </div>
                </div>

                {ticketsLoading && tickets.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-8 h-8 border-2 border-[#55694A]/20 border-t-[#55694A] rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-[#6D5C4C] font-sans mt-3">Loading your support records...</p>
                  </div>
                ) : ticketsError ? (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-xs text-red-700 space-y-2">
                    <p>{ticketsError}</p>
                    <button
                      onClick={fetchMyTickets}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg font-bold uppercase tracking-wider text-[11px]"
                    >
                      Try Again
                    </button>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-[#DACDB3] rounded-3xl bg-[#FAF7F0]/40 p-8 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-[#55694A]/10 text-[#55694A] flex items-center justify-center mx-auto">
                      <LifeBuoy className="w-7 h-7" />
                    </div>
                    <div className="max-w-md mx-auto">
                      <h4 className="font-serif text-lg text-[#362B21]">No Active Complaints</h4>
                      <p className="text-xs text-[#6D5C4C] mt-1 leading-relaxed">
                        You have not registered any support cases. If you experienced an issue with a delivery, damaged piece, or craftsmanship concern, click below to open an official ticket.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNewComplaintModal(true)}
                      className="px-5 py-2.5 bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Register New Support Ticket
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((t) => (
                      <div
                        key={t.ticketId}
                        onClick={() => openTicketDetail(t.ticketId)}
                        className="p-5 bg-[#FAF7F0] border border-[#DACDB3] hover:border-[#55694A]/60 rounded-2xl transition-all shadow-2xs hover:shadow-sm cursor-pointer group space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DACDB3]/50 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="font-serif text-base font-bold text-[#362B21] group-hover:text-[#55694A] transition-colors">
                              {t.ticketId}
                            </span>
                            <span className="text-xs font-semibold text-[#4E3C2B] bg-[#EFE8D8] px-2.5 py-0.5 rounded-full border border-[#DACDB3]">
                              {t.category}
                            </span>
                            {t.orderNumber && (
                              <span className="text-[11px] text-[#55694A] font-medium bg-[#55694A]/10 px-2 py-0.5 rounded-md">
                                Order #{t.orderNumber}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                                t.priority === 'Urgent'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : t.priority === 'High'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-stone-100 text-stone-700 border-stone-200'
                              }`}
                            >
                              {t.priority}
                            </span>
                            <span
                              className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${
                                t.status === 'Open'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : t.status === 'In Progress'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : t.status === 'Waiting for Customer'
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : t.status === 'Resolved'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : 'bg-stone-100 text-stone-600 border-stone-200'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-serif text-base font-medium text-[#241C16]">
                            {t.subject}
                          </h4>
                          {t.customerMessage && (
                            <p className="text-xs text-[#6C5E53] line-clamp-2 mt-1 italic">
                              "{t.customerMessage}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[11px] text-[#8C7D70] font-sans border-t border-[#DACDB3]/40">
                          <div className="flex items-center gap-3">
                            <span>Created: {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {t.updatedAt && (
                              <span>&bull; Updated: {new Date(t.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            )}
                          </div>
                          <span className="text-[#55694A] font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            View Ticket Details
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* TICKET DETAIL DRAWER / MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FAF7F0] rounded-3xl border border-[#DACDB3] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-[#34402D] text-[#FAF7F0] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-serif text-xl font-medium tracking-wide">
                    Ticket {selectedTicket.ticketId}
                  </span>
                  <span
                    className={`text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      selectedTicket.priority === 'Urgent'
                        ? 'bg-red-900/60 text-red-200 border-red-400'
                        : selectedTicket.priority === 'High'
                        ? 'bg-amber-900/60 text-amber-200 border-amber-400'
                        : 'bg-stone-800 text-stone-200 border-stone-600'
                    }`}
                  >
                    {selectedTicket.priority} Priority
                  </span>
                  <span
                    className={`text-[11px] font-bold px-3 py-0.5 rounded-full ${
                      selectedTicket.status === 'Open'
                        ? 'bg-rose-500 text-white'
                        : selectedTicket.status === 'In Progress'
                        ? 'bg-amber-500 text-black font-semibold'
                        : selectedTicket.status === 'Waiting for Customer'
                        ? 'bg-blue-400 text-black font-semibold'
                        : selectedTicket.status === 'Resolved'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-500 text-white'
                    }`}
                  >
                    {selectedTicket.status}
                  </span>
                </div>
                <p className="text-xs text-[#FAF7F0]/70 font-sans mt-1">
                  Category: {selectedTicket.category} &bull; Created {new Date(selectedTicket.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-xl hover:bg-white/10 text-[#FAF7F0] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs font-sans text-[#241C16]">
              {/* Complaint Overview */}
              <div className="p-4 bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#6D5C4C]">
                  <span className="uppercase tracking-wider font-bold">Original Complaint Subject</span>
                  {selectedTicket.orderNumber && (
                    <span className="font-semibold text-[#55694A]">
                      Linked Order: #{selectedTicket.orderNumber}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg text-[#362B21] font-semibold">
                  {selectedTicket.subject}
                </h3>
                <div className="p-3.5 bg-[#FAF7F0] rounded-xl border-l-4 border-[#34402D] text-xs leading-relaxed text-[#362B21] italic">
                  "{selectedTicket.customerMessage}"
                </div>

                {/* Attachments if any */}
                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D5C4C] block mb-1.5">
                      Attached Documentation / Photographs:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedTicket.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F0] border border-[#DACDB3] rounded-lg text-xs hover:border-[#55694A] transition-colors font-medium text-[#362B21]"
                        >
                          <Image className="w-3.5 h-3.5 text-[#55694A]" />
                          {att.name || `Photo #${i + 1}`}
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* TIMELINE OF STATUS CHANGES */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6D5C4C] mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#55694A]" />
                  Status & Activity Timeline
                </h4>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DACDB3]">
                  {selectedTicket.timeline && selectedTicket.timeline.length > 0 ? (
                    selectedTicket.timeline.map((item, idx) => (
                      <div key={idx} className="relative group">
                        <div
                          className={`absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            item.status === 'Resolved'
                              ? 'bg-emerald-600'
                              : item.status === 'In Progress'
                              ? 'bg-amber-500'
                              : item.status === 'Waiting for Customer'
                              ? 'bg-blue-500'
                              : 'bg-[#55694A]'
                          }`}
                        />
                        <div className="p-3 bg-[#EFE8D8]/70 border border-[#DACDB3] rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10.5px] text-[#6D5C4C]">
                            <span className="font-semibold text-[#362B21]">
                              {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at{' '}
                              {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {item.status && (
                              <span className="font-bold text-[#55694A] uppercase text-[10px]">
                                Status: {item.status}
                              </span>
                            )}
                          </div>
                          <p className="text-[#362B21] font-medium">{item.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#6D5C4C] italic">No timeline updates recorded.</p>
                  )}
                </div>
              </div>

              {/* MESSAGES & SUPPORT REPLIES THREAD */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6D5C4C] mb-3 flex items-center gap-2">
                  <MessageSquareQuote className="w-4 h-4 text-[#55694A]" />
                  Support Conversation & Updates
                </h4>

                <div className="space-y-3">
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                          m.sender === 'admin'
                            ? 'bg-[#E5DCB8]/60 border border-[#DACDB3] ml-4 sm:ml-8'
                            : 'bg-white border border-[#DACDB3] mr-4 sm:mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#6D5C4C] mb-1">
                          <span className={`font-bold ${m.sender === 'admin' ? 'text-[#34402D]' : 'text-[#55694A]'}`}>
                            {m.sender === 'admin' ? 'Atelier Concierge Desk' : 'You (Client)'}
                          </span>
                          <span>{new Date(m.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        <p className="text-[#241C16] text-[12.5px] leading-relaxed whitespace-pre-wrap">{m.message}</p>
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="pt-2 flex flex-wrap gap-2">
                            {m.attachments.map((att, ai) => (
                              <a
                                key={ai}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-[#55694A] underline font-medium"
                              >
                                <Image className="w-3 h-3" />
                                {att.name || 'Photo'}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#8C7D70] italic">No replies on this ticket yet.</p>
                  )}
                </div>
              </div>

              {/* CUSTOMER REPLY FORM */}
              {selectedTicket.status !== 'Closed' ? (
                <div className="p-4 bg-[#EFE8D8] border border-[#DACDB3] rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#362B21]">
                    Add Information or Reply to this Ticket
                  </h4>
                  <p className="text-[11px] text-[#6D5C4C]">
                    Submit follow-up details, answers to atelier requests, or additional photographs directly to this case.
                  </p>

                  <form onSubmit={handleSendCustomerReply} className="space-y-3">
                    <textarea
                      rows={3}
                      required
                      placeholder="Type your message, provide updates, or clarify details..."
                      value={customerReplyText}
                      onChange={(e) => setCustomerReplyText(e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl p-3 text-xs focus:outline-none focus:border-[#55694A] text-[#241C16]"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          placeholder="Optional photograph / documentation image URL"
                          value={customerReplyAttachment}
                          onChange={(e) => setCustomerReplyAttachment(e.target.value)}
                          className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#55694A] text-[#241C16]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={replySubmitting || !customerReplyText.trim()}
                        className="px-5 py-2.5 bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] rounded-xl font-bold uppercase tracking-wider text-xs transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer justify-center"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {replySubmitting ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-4 bg-stone-100 border border-stone-300 rounded-2xl text-center text-xs text-stone-600">
                  This support ticket has been closed. If you need further assistance with a new issue, please register a new complaint.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW COMPLAINT REGISTRATION MODAL */}
      {showNewComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FAF7F0] rounded-3xl border border-[#DACDB3] p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DACDB3]/70 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#55694A] font-bold">
                  OFFICIAL RESOLUTION DESK
                </span>
                <h3 className="font-serif text-2xl text-[#362B21] mt-0.5">
                  Register a Complaint / Ticket
                </h3>
              </div>
              <button
                onClick={() => setShowNewComplaintModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#EFE8D8] text-[#4E3C2B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verified Identity Badge */}
            <div className="p-3 bg-[#EFE8D8] rounded-xl border border-[#DACDB3] text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-[#362B21] block">
                  Verified Client: {user?.firstName} {user?.lastName}
                </span>
                <span className="text-[#6D5C4C]">{user?.email}</span>
              </div>
              <span className="px-2.5 py-1 bg-[#55694A] text-white rounded-md text-[10px] font-bold uppercase tracking-wider">
                Account Verified
              </span>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-3.5 text-xs text-[#241C16]">
              {/* Linked Order & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider font-bold mb-1 text-[11px] text-[#4E3C2B]">
                    Related Order
                  </label>
                  <select
                    value={complaintForm.orderNumber}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, orderNumber: e.target.value }))}
                    className="w-full bg-[#EFE8D8] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#55694A] cursor-pointer"
                  >
                    <option value="">None / General Inquiry</option>
                    {allUserOrders.map(o => (
                      <option key={o._id} value={o.orderNumber}>
                        #{o.orderNumber} — ₹{o.total?.toLocaleString('en-IN')} ({o.orderStatus})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-bold mb-1 text-[11px] text-[#4E3C2B]">
                    Issue Category *
                  </label>
                  <select
                    value={complaintForm.category}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-[#EFE8D8] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#55694A] cursor-pointer"
                  >
                    <option value="Damaged Product">Damaged Product</option>
                    <option value="Wrong Product">Wrong Product</option>
                    <option value="Delivery">Delivery / Logistics Issue</option>
                    <option value="Payment">Payment & Billing Concern</option>
                    <option value="Return">Return Request</option>
                    <option value="Refund">Refund Status</option>
                    <option value="Product">Product Quality / Craftsmanship</option>
                    <option value="Cancellation">Order Cancellation</option>
                    <option value="General Enquiry">General Enquiry</option>
                    <option value="Other">Other Atelier Concern</option>
                  </select>
                </div>
              </div>

              {/* Priority & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block uppercase tracking-wider font-bold mb-1 text-[11px] text-[#4E3C2B]">
                    Priority
                  </label>
                  <select
                    value={complaintForm.priority}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-[#EFE8D8] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#55694A] cursor-pointer"
                  >
                    <option value="Normal">Normal Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block uppercase tracking-wider font-bold mb-1 text-[11px] text-[#4E3C2B]">
                    Subject / Summary *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Damaged edge binding on delivered rug"
                    value={complaintForm.subject}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-[#EFE8D8] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#55694A]"
                  />
                </div>
              </div>

              {/* Contact Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider font-bold mb-1 text-[11px] text-[#4E3C2B]">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={complaintForm.phone}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[#EFE8D8] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#55694A]"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider font-bold mb-1 text-[11px] text-[#4E3C2B]">
                    WhatsApp Contact Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={complaintForm.whatsapp}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    className="w-full bg-[#EFE8D8] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#55694A]"
                  />
                </div>
              </div>

              {/* Complaint Message */}
              <div>
                <label className="block uppercase tracking-wider font-bold mb-1 text-[11px] text-[#4E3C2B]">
                  Detailed Complaint / Issue Description *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please describe the defect, damage, or delivery issue in complete detail. Our master craftsmen and support desk will review this case..."
                  value={complaintForm.customerMessage}
                  onChange={(e) => setComplaintForm(prev => ({ ...prev, customerMessage: e.target.value }))}
                  className="w-full bg-[#EFE8D8] border border-[#DACDB3] rounded-xl p-3 focus:outline-none focus:border-[#55694A]"
                />
              </div>

              {/* Photo / Attachment URL */}
              <div>
                <label className="block uppercase tracking-wider font-bold mb-1 text-[11px] text-[#4E3C2B]">
                  Photo or Documentation URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="Paste direct URL to photograph of damage, packing slip, etc."
                  value={complaintForm.attachmentUrl}
                  onChange={(e) => setComplaintForm(prev => ({ ...prev, attachmentUrl: e.target.value }))}
                  className="w-full bg-[#EFE8D8] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#55694A]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#DACDB3]/70">
                <button
                  type="button"
                  onClick={() => setShowNewComplaintModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#DACDB3] text-[#4E3C2B] font-bold uppercase tracking-wider hover:bg-[#EFE8D8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={complaintSaving || !complaintForm.customerMessage.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] font-bold uppercase tracking-wider shadow-sm disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
                >
                  {complaintSaving ? 'Submitting...' : 'Submit Complaint Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

