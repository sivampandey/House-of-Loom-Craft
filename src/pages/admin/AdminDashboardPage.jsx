import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Package,
  AlertTriangle,
  Tag,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Eye
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getDashboard();
      if (res?.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = data?.stats || {
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockCount: 0,
    activeOffersCount: 0
  };

  const recentOrders = data?.recentOrders || [];
  const lowStockProducts = data?.lowStockProducts || [];

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
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DACDB3]">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold block">
            Store Overview & Metrics
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light mt-1">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#DACDB3] bg-[#EFE8D8] text-xs font-sans font-medium text-[#362B21] hover:bg-[#E2D8C3] transition-colors"
            title="Refresh database metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] text-xs uppercase tracking-wider font-sans font-bold rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#B24C40]/10 border border-[#B24C40]/30 text-[#B24C40] text-xs font-sans flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboard} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {/* Total Revenue */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8F6E50] font-sans font-bold">
              Total Revenue
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#55694A]/10 text-[#55694A] flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <span className="font-sans text-xl sm:text-2xl font-bold text-[#362B21] block">
            {formatINR(stats.totalRevenue)}
          </span>
          <span className="text-[10px] text-[#544131]/70 font-sans block">
            Net confirmed sales
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8F6E50] font-sans font-bold">
              Total Orders
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#BA9977]/20 text-[#8F6E50] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <span className="font-sans text-xl sm:text-2xl font-bold text-[#362B21] block">
            {stats.totalOrders}
          </span>
          <span className="text-[10px] text-[#544131]/70 font-sans block">
            Lifetime orders recorded
          </span>
        </div>

        {/* Pending Orders */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8F6E50] font-sans font-bold">
              Pending Orders
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="font-sans text-xl sm:text-2xl font-bold text-[#362B21] block">
            {stats.pendingOrders}
          </span>
          <span className="text-[10px] text-amber-700 font-sans font-medium block">
            Awaiting dispatch/fulfillment
          </span>
        </div>

        {/* Completed Orders */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8F6E50] font-sans font-bold">
              Delivered Orders
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="font-sans text-xl sm:text-2xl font-bold text-[#362B21] block">
            {stats.completedOrders}
          </span>
          <span className="text-[10px] text-emerald-700 font-sans font-medium block">
            Successfully delivered
          </span>
        </div>

        {/* Total Customers */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8F6E50] font-sans font-bold">
              Total Customers
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="font-sans text-xl sm:text-2xl font-bold text-[#362B21] block">
            {stats.totalCustomers}
          </span>
          <span className="text-[10px] text-[#544131]/70 font-sans block">
            Customer accounts
          </span>
        </div>

        {/* Total Products */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8F6E50] font-sans font-bold">
              Total Products
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#55694A]/10 text-[#55694A] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <span className="font-sans text-xl sm:text-2xl font-bold text-[#362B21] block">
            {stats.totalProducts}
          </span>
          <span className="text-[10px] text-[#544131]/70 font-sans block">
            Active & draft listings
          </span>
        </div>

        {/* Low Stock Warning */}
        <Link
          to="/admin/products?stockStatus=low_stock"
          className={`bg-[#EFE8D8] rounded-2xl border p-4 sm:p-5 shadow-sm space-y-2 transition-all hover:scale-[1.02] ${
            stats.lowStockCount > 0 ? 'border-amber-400 bg-amber-50/40' : 'border-[#DACDB3]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8F6E50] font-sans font-bold">
              Low Stock
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <span className="font-sans text-xl sm:text-2xl font-bold text-[#362B21] block">
            {stats.lowStockCount}
          </span>
          <span className="text-[10px] text-amber-800 font-sans font-medium block">
            {stats.lowStockCount > 0 ? 'Action needed (≤ 5 units)' : 'Stock levels healthy'}
          </span>
        </Link>

        {/* Active Offers */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8F6E50] font-sans font-bold">
              Active Offers
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <span className="font-sans text-xl sm:text-2xl font-bold text-[#362B21] block">
            {stats.activeOffersCount}
          </span>
          <span className="text-[10px] text-[#544131]/70 font-sans block">
            Live promotions & coupons
          </span>
        </div>
      </div>

      {/* Low Stock Attention List (if any exists) */}
      {lowStockProducts.length > 0 && (
        <div className="bg-[#FAF0DE] rounded-2xl border border-amber-300 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="font-serif text-lg font-medium text-[#362B21]">
                Low Stock Inventory Notice
              </h2>
            </div>
            <Link
              to="/admin/products?stockStatus=low_stock"
              className="text-xs uppercase tracking-wider text-[#55694A] font-sans font-bold hover:underline"
            >
              View All Low Stock &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div
                key={p._id}
                className="bg-[#FAF7F0] p-3 rounded-xl border border-amber-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={p.thumbnail || (p.images && p.images[0]) || '/images/room-after.jpg'}
                    alt={p.name}
                    className="w-10 h-10 object-cover rounded-lg bg-[#EAE2D2] shrink-0"
                  />
                  <div className="overflow-hidden">
                    <h3 className="font-serif text-xs text-[#362B21] font-medium truncate" title={p.name}>
                      {p.name}
                    </h3>
                    <span className="text-[10px] text-amber-700 font-bold block">
                      Only {p.stock} units remaining
                    </span>
                  </div>
                </div>

                <Link
                  to={`/admin/products/${p._id}/edit`}
                  className="px-2.5 py-1 rounded bg-[#55694A] text-[#FAF7F0] text-[10px] uppercase tracking-wider font-bold shrink-0"
                >
                  Restock
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DACDB3]">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-[#362B21] font-light">
              Recent Orders
            </h2>
            <p className="text-xs text-[#544131]/70 font-sans mt-0.5">
              Latest customer orders from the store.
            </p>
          </div>

          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#55694A] hover:text-[#362B21] font-sans font-bold transition-colors"
          >
            <span>All Orders</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <ShoppingBag className="w-10 h-10 text-[#8F6E50]/40 mx-auto" />
            <h3 className="font-serif text-lg text-[#362B21] font-light">
              No orders recorded yet
            </h3>
            <p className="text-xs text-[#544131]/70 font-sans max-w-sm mx-auto">
              When customers place orders via the storefront, they will immediately appear here with real database timestamps and status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[#DACDB3] text-[10px] uppercase tracking-wider text-[#8F6E50] font-bold">
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Delivery Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DACDB3]/60">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-[#EAE2D2]/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#362B21]">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-[#362B21] block">
                        {order.shippingAddress?.fullName || (order.userId ? `${order.userId.firstName} ${order.userId.lastName}` : 'Guest')}
                      </span>
                      <span className="text-[10px] text-[#544131]/70 block font-mono">
                        {order.userId?.email || order.shippingAddress?.phone}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#544131]/80">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#362B21]">
                      {formatINR(order.total)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="uppercase text-[10px] font-mono font-semibold block text-[#362B21]">
                        {order.paymentMethod}
                      </span>
                      <span className={`text-[9.5px] uppercase font-bold ${order.paymentStatus === 'completed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${getStatusBadge(order.orderStatus)}`}>
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/admin/orders/${order._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#DACDB3] text-[10px] uppercase tracking-wider font-bold text-[#55694A] hover:bg-[#E2D8C3] transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
