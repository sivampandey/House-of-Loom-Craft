import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Search, ShieldCheck, UserCheck, Trash2, Calendar, 
  ShoppingBag, IndianRupee, AlertTriangle, X, RefreshCw
} from 'lucide-react';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null, loading: false, error: null });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getUsers();
      const userList = res?.users || res?.data?.users || (Array.isArray(res) ? res : []);
      setUsers(userList);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.message || err.data?.message || err.response?.data?.message || 'Failed to retrieve users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.user) return;
    try {
      setDeleteModal(prev => ({ ...prev, loading: true, error: null }));
      await adminAPI.deleteUser(deleteModal.user._id);
      setDeleteModal({ open: false, user: null, loading: false, error: null });
      fetchUsers();
    } catch (err) {
      setDeleteModal(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.message || err.data?.message || err.response?.data?.message || 'Failed to delete user' 
      }));
    }
  };

  const filteredUsers = users.filter(u => {
    const fullName = (u.name || `${u.firstName || ''} ${u.lastName || ''}`).trim();
    const matchesSearch = 
      (fullName && fullName.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.phone && u.phone.includes(search));
    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1E261B] tracking-wide">Customers</h1>
          <p className="text-xs text-[#1E261B]/60 mt-1">
            Review registered customer profiles, order histories, and account roles.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1E261B] bg-white border border-[#1E261B]/15 rounded hover:bg-[#F5F0E6] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stats Quick Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#1E261B]/10 p-4 rounded-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#1E261B]/60 uppercase tracking-wider">Total Accounts</span>
            <Users className="w-4 h-4 text-[#45563D]" />
          </div>
          <p className="text-2xl font-serif text-[#1E261B] mt-2">{users.length}</p>
        </div>
        <div className="bg-white border border-[#1E261B]/10 p-4 rounded-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#1E261B]/60 uppercase tracking-wider">Admins</span>
            <ShieldCheck className="w-4 h-4 text-[#BA9977]" />
          </div>
          <p className="text-2xl font-serif text-[#1E261B] mt-2">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>
        <div className="bg-white border border-[#1E261B]/10 p-4 rounded-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#1E261B]/60 uppercase tracking-wider">Customers</span>
            <UserCheck className="w-4 h-4 text-[#45563D]" />
          </div>
          <p className="text-2xl font-serif text-[#1E261B] mt-2">
            {users.filter(u => u.role !== 'admin').length}
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-[#1E261B]/10 p-4 rounded-sm flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1E261B]/40" />
          <input
            type="text"
            placeholder="Search by customer name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#1E261B]/15 rounded bg-transparent focus:outline-none focus:border-[#45563D]"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-[#1E261B]/15 rounded px-3 py-2 bg-white focus:outline-none focus:border-[#45563D]"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="user">Customers</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white border border-[#1E261B]/10 rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#1E261B]/60">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#45563D]" />
            Loading accounts database...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-600 bg-red-50/50">
            {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#1E261B]/60">
            No accounts match your query criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E261B]/10 bg-[#FAF7F2] text-[#1E261B]/70 font-serif">
                  <th className="p-3 pl-4">Customer</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Joined Date</th>
                  <th className="p-3 text-center">Orders</th>
                  <th className="p-3 text-right">Total Spent</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E261B]/5">
                {filteredUsers.map((u) => {
                  const isCurrent = currentUser && (currentUser._id === u._id || currentUser.email === u.email);
                  const displayName = (u.name || `${u.firstName || ''} ${u.lastName || ''}`).trim() || 'Customer';
                  return (
                    <tr key={u._id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#EAE2D5] text-[#1E261B] font-serif flex items-center justify-center text-xs font-semibold">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[#1E261B]">
                              {displayName}
                              {isCurrent && (
                                <span className="ml-2 text-[10px] font-sans px-1.5 py-0.5 bg-[#45563D]/10 text-[#45563D] rounded">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-[#1E261B]/50 font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider ${
                          u.role === 'admin' 
                            ? 'bg-[#BA9977]/15 text-[#8C6D4F]' 
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {u.role === 'admin' && <ShieldCheck className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-[#1E261B]/80 font-mono text-[11px]">
                        {u.phone || '—'}
                      </td>
                      <td className="p-3 text-[#1E261B]/60">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : '—'}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {u.totalOrders ?? u.orderCount ?? 0}
                      </td>
                      <td className="p-3 text-right font-mono font-medium text-[#1E261B]">
                        ₹{((u.totalSpent || 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 pr-4 text-right">
                        {isCurrent ? (
                          <span className="text-[10px] text-[#1E261B]/40 italic">Active Session</span>
                        ) : (
                          <button
                            onClick={() => setDeleteModal({ open: true, user: u, loading: false, error: null })}
                            className="p-1.5 text-[#1E261B]/40 hover:text-red-600 rounded transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete User Confirmation Modal */}
      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-sm border border-[#1E261B]/15 shadow-xl p-6 relative">
            <button
              onClick={() => setDeleteModal({ open: false, user: null, loading: false, error: null })}
              className="absolute top-4 right-4 text-[#1E261B]/40 hover:text-[#1E261B]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-serif text-[#1E261B]">Remove Customer</h3>
            </div>

            <p className="text-xs text-[#1E261B]/70 leading-relaxed">
              Are you sure you want to permanently remove customer{' '}
              <strong className="text-[#1E261B]">{deleteModal.user.email}</strong>?
            </p>

            {deleteModal.user.role === 'admin' && (
              <p className="text-xs text-red-600 mt-2 font-medium bg-red-50 p-2 rounded">
                Warning: This is an administrative user. At least one admin must always remain in the system.
              </p>
            )}

            {deleteModal.error && (
              <p className="text-xs text-red-600 mt-3 bg-red-50 p-2.5 rounded border border-red-200">
                {deleteModal.error}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#1E261B]/10">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, user: null, loading: false, error: null })}
                disabled={deleteModal.loading}
                className="px-4 py-2 text-xs text-[#1E261B]/70 hover:text-[#1E261B] font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteModal.loading}
                className="px-4 py-2 text-xs bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteModal.loading ? 'Removing...' : 'Remove Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
