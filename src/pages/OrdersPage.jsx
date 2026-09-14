import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ArrowRight, ArrowLeft, Clock, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import SEO from '../components/common/SEO';
import { ordersAPI } from '../services/api';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await ordersAPI.getOrders();
        if (res.success && res.orders) {
          setOrders(res.orders);
        }
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[#55694A]/10 text-[#55694A] border-[#55694A]/30';
      case 'processing':
        return 'bg-[#BA9977]/10 text-[#8F6A44] border-[#BA9977]/30';
      case 'shipped':
      case 'out_for_delivery':
        return 'bg-blue-900/10 text-blue-900 border-blue-800/30';
      case 'delivered':
        return 'bg-[#362B21] text-[#FAF7F0] border-[#362B21]';
      case 'cancelled':
        return 'bg-red-900/10 text-red-900 border-red-800/30';
      default:
        return 'bg-[#E5DCB8] text-[#362B21] border-[#DACDB3]';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-28 sm:pt-32 pb-24">
      <SEO
        title="Orders & History | Pottery Rugs & Home Decor"
        description="View your order history, delivery timeline, and master loom tracking for Pottery Rugs & Home Decor."
        path="/orders"
      />

      <div className="max-w-5xl mx-auto px-6 md:px-12">
        {/* Navigation Back */}
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#55694A] font-sans font-bold mb-8">
          <Link to="/profile" className="hover:text-[#362B21] transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Client Atelier Profile
          </Link>
          <span className="text-[#DACDB3]">/</span>
          <span className="text-[#362B21]">Orders</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[#DACDB3] mb-10">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold block">
              ORDER HISTORY
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#362B21] font-light">
              Order History
            </h1>
            <p className="text-xs text-[#4E3C2B]">
              Review your dispatched carpets, bespoke commissions, and architectural home accents.
            </p>
          </div>

          <Link
            to="/collections"
            className="px-6 py-2.5 rounded-full bg-[#55694A] text-[#FAF7F0] text-xs uppercase tracking-widest font-sans font-bold hover:bg-[#6D8262] transition-colors shadow-sm self-start md:self-auto"
          >
            Explore Masterpieces
          </Link>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-[#55694A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-serif text-sm tracking-widest text-[#4E3C2B] uppercase">Consulting Order Ledger...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] space-y-4">
            <Package className="w-12 h-12 text-[#55694A] mx-auto opacity-60" />
            <h2 className="font-serif text-3xl text-[#362B21] font-light">No Order History Yet</h2>
            <p className="text-xs text-[#4E3C2B] max-w-md mx-auto leading-relaxed">
              You haven't placed any orders yet. Explore our handcrafted heirloom rugs to begin your private collection.
            </p>
            <Link
              to="/collections"
              className="inline-block mt-4 px-8 py-3.5 bg-[#55694A] text-[#FAF7F0] text-xs uppercase tracking-widest font-bold rounded-full shadow-md"
            >
              Discover Collections
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                onClick={() => navigate(`/orders/${order.orderNumber || order._id}`)}
                className="group bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] hover:border-[#55694A] p-6 sm:p-8 transition-all shadow-sm hover:shadow-lg cursor-pointer card-hover-lift"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#DACDB3]/70">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm sm:text-base font-bold text-[#362B21]">
                        {order.orderNumber}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold border ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[#4E3C2B]">
                      Order Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] uppercase tracking-wider text-[#4E3C2B]/70 block">
                      Total Price
                    </span>
                    <span className="font-sans text-xl sm:text-2xl font-bold text-[#362B21]">
                      ₹{(order.total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF7F0] border border-[#DACDB3]/60">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#3C4A34] flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-serif text-sm text-[#362B21] font-medium truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-[#55694A] font-mono">
                          Qty: {item.quantity} · ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-[#DACDB3]/60 flex items-center justify-between text-xs">
                  <div className="text-[#4E3C2B] flex items-center gap-2">
                    <span className="capitalize">{order.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery (COD)'}</span>
                    <span>·</span>
                    <span className="text-[#55694A] font-bold">
                      {order.paymentStatus === 'completed' ? 'Paid' : 'Payment on Delivery'}
                    </span>
                  </div>

                  <span className="text-[#55694A] font-bold uppercase tracking-wider flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                    <span>Inspect Timeline & Invoice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
