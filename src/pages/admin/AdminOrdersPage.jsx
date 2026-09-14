import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  IndianRupee
} from 'lucide-react';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getOrders({
        search,
        orderStatus,
        paymentStatus,
        paymentMethod,
        page,
        limit: 15
      });
      if (res?.success) {
        setOrders(res.orders || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve order records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [orderStatus, paymentStatus, paymentMethod, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleQuickStatusChange = async (orderId, newStatus) => {
    if (!window.confirm(`Update order status to "${newStatus}"?`)) return;
    setUpdatingId(orderId);
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus, `Status quickly updated to ${newStatus} from orders table.`);
      fetchOrders();
    } catch (err) {
      alert(err.message || 'Unable to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatINR = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'shipped':
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'processing':
      case 'confirmed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DACDB3]">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold block">
            Fulfillment & Delivery Dispatch
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light mt-1">
            Client Orders
          </h1>
          <p className="text-xs text-[#544131]/70 font-sans mt-0.5">
            {total} total orders recorded in database ({orders.length} displayed on page {page})
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="self-start sm:self-auto p-2 rounded-xl border border-[#DACDB3] bg-[#EFE8D8] text-[#362B21] hover:bg-[#E2D8C3]"
          title="Reload order records"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#B24C40]/10 border border-[#B24C40]/30 text-[#B24C40] text-xs font-sans">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-4 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#8F6E50] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID (PR-...), customer name, email, phone..."
              className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl pl-10 pr-20 py-2 text-xs text-[#362B21] placeholder-[#544131]/40 focus:outline-none focus:border-[#55694A]"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#55694A] text-[#FAF7F0] text-[10px] uppercase tracking-wider font-bold rounded-lg"
            >
              Search
            </button>
          </form>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Delivery Status */}
            <select
              value={orderStatus}
              onChange={(e) => { setOrderStatus(e.target.value); setPage(1); }}
              className="bg-[#FAF7F0] border border-[#DACDB3] text-xs rounded-xl px-3 py-2 text-[#362B21] font-sans focus:outline-none"
            >
              <option value="all">All Delivery Statuses</option>
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>{st.replace(/_/g, ' ').toUpperCase()}</option>
              ))}
            </select>

            {/* Payment Method */}
            <select
              value={paymentMethod}
              onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
              className="bg-[#FAF7F0] border border-[#DACDB3] text-xs rounded-xl px-3 py-2 text-[#362B21] font-sans focus:outline-none"
            >
              <option value="all">All Payment Methods</option>
              <option value="cod">Cash on Delivery (COD)</option>
              <option value="online">Online (Razorpay)</option>
            </select>

            {/* Payment Status */}
            <select
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
              className="bg-[#FAF7F0] border border-[#DACDB3] text-xs rounded-xl px-3 py-2 text-[#362B21] font-sans focus:outline-none"
            >
              <option value="all">All Payment Statuses</option>
              <option value="completed">Completed / Paid</option>
              <option value="pending">Pending Payment</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#55694A] border-t-transparent rounded-full animate-spin mx-auto" />
            <span className="text-xs uppercase tracking-wider text-[#544131]/70 font-sans block">
              Fetching Order Records...
            </span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-[#8F6E50]/40 mx-auto" />
            <h2 className="font-serif text-xl text-[#362B21] font-light">No Orders Found</h2>
            <p className="text-xs text-[#544131]/70 font-sans max-w-sm mx-auto">
              No orders match the selected filters or search terms.
            </p>
            <button
              onClick={() => { setSearch(''); setOrderStatus('all'); setPaymentMethod('all'); setPaymentStatus('all'); }}
              className="px-4 py-1.5 bg-[#55694A] text-[#FAF7F0] text-xs uppercase tracking-wider rounded-lg font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-[#E8DFD0] border-b border-[#DACDB3] text-[10px] uppercase tracking-wider text-[#8F6E50] font-bold">
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status & Workflow</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DACDB3]/60">
                {orders.map((o) => {
                  const clientName = o.shippingAddress?.fullName || (o.userId ? `${o.userId.firstName} ${o.userId.lastName}` : 'Guest');
                  const clientEmail = o.userId?.email || o.shippingAddress?.phone;
                  const totalItems = (o.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);

                  return (
                    <tr key={o._id} className="hover:bg-[#FAF7F0]/60 transition-colors">
                      {/* Order Number & Date */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-sm text-[#362B21] block">
                          {o.orderNumber}
                        </span>
                        <span className="text-[10px] text-[#544131]/70 block">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#362B21] block">
                          {clientName}
                        </span>
                        <span className="text-[10px] text-[#544131]/60 font-mono block">
                          {clientEmail}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#362B21] block">
                          {totalItems} piece{totalItems !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[10px] text-[#55694A] block truncate max-w-[160px]">
                          {o.items?.[0]?.name || 'Heirloom Piece'}
                          {o.items?.length > 1 ? ` +${o.items.length - 1} more` : ''}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#362B21] block">
                          {formatINR(o.total)}
                        </span>
                        {o.couponDiscount > 0 && (
                          <span className="text-[9.5px] text-emerald-700 font-bold block">
                            Saved {formatINR(o.couponDiscount)} ({o.couponCode})
                          </span>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-4">
                        <span className="uppercase text-[10px] font-mono font-bold text-[#362B21] block">
                          {o.paymentMethod}
                        </span>
                        <span className={`text-[9.5px] uppercase font-bold ${
                          o.paymentStatus === 'completed'
                            ? 'text-emerald-700'
                            : o.paymentStatus === 'refund_required'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        }`}>
                          {o.paymentStatus}
                        </span>
                      </td>

                      {/* Status Transition Select */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={o.orderStatus}
                            disabled={updatingId === o._id}
                            onChange={(e) => handleQuickStatusChange(o._id, e.target.value)}
                            className={`text-[10px] uppercase font-bold py-1 px-2.5 rounded-full border focus:outline-none ${getStatusBadge(o.orderStatus)}`}
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st.replace(/_/g, ' ').toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/orders/${o._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DACDB3] text-xs uppercase tracking-wider font-bold text-[#55694A] hover:bg-[#55694A] hover:text-[#FAF7F0] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#DACDB3] flex items-center justify-between">
            <span className="text-xs text-[#544131]/70">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-[#DACDB3] text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-[#DACDB3] text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
