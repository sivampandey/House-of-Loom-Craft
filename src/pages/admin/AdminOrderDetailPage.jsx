import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  IndianRupee,
  Calendar,
  User,
  MapPin,
  Clock,
  Printer,
  Save,
  CheckCircle2,
  AlertCircle
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

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status update state
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState('');

  // Tracking update state
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [shippingNote, setShippingNote] = useState('');
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);
  const [trackingSuccess, setTrackingSuccess] = useState('');

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getOrderById(id);
      if (res?.success && res.order) {
        const o = res.order;
        setOrder(o);
        setNewStatus(o.orderStatus || 'confirmed');
        setTrackingNumber(o.trackingNumber || '');
        setCarrier(o.carrier || '');
        setShippingNote(o.shippingNote || '');
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setStatusSuccess('');
    setIsUpdatingStatus(true);
    try {
      const res = await adminAPI.updateOrderStatus(id, newStatus, statusNote);
      setOrder(res.order);
      setStatusSuccess(`Status successfully transitioned to ${newStatus}.`);
      setStatusNote('');
      setTimeout(() => setStatusSuccess(''), 3500);
    } catch (err) {
      alert(err.message || 'Failed to update order status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateTracking = async (e) => {
    e.preventDefault();
    setTrackingSuccess('');
    setIsUpdatingTracking(true);
    try {
      const res = await adminAPI.updateOrderTracking(id, {
        trackingNumber,
        carrier,
        shippingNote
      });
      setOrder(res.order);
      setTrackingSuccess('Shipment tracking details saved.');
      setTimeout(() => setTrackingSuccess(''), 3500);
    } catch (err) {
      alert(err.message || 'Failed to save tracking details.');
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  const formatINR = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-[#55694A] border-t-transparent rounded-full animate-spin mx-auto" />
        <span className="text-xs uppercase tracking-wider text-[#544131]/70 font-sans block">
          Loading Order Records...
        </span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="font-serif text-2xl text-[#362B21]">Order Record Not Found</h2>
        <Link to="/admin/orders" className="text-xs font-bold text-[#55694A] underline">
          &larr; Return to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DACDB3]">
        <div className="space-y-1">
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#55694A] hover:text-[#362B21] font-sans font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders List</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl text-[#362B21] font-light">
              Order {order.orderNumber}
            </h1>
            <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-[#4C5D41] text-[#FAF7F0]">
              {order.orderStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#DACDB3] bg-[#EFE8D8] text-xs font-sans font-medium text-[#362B21] hover:bg-[#E2D8C3]"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#B24C40]/10 border border-[#B24C40]/30 text-[#B24C40] text-xs font-sans">
          {error}
        </div>
      )}

      {/* Grid: Details & Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Items & Client Info */}
        <div className="lg:col-span-7 space-y-6">
          {/* Purchased Items Card */}
          <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-xl text-[#362B21] font-medium border-b border-[#DACDB3] pb-2">
              Purchased Pieces ({(order.items || []).length})
            </h2>

            <div className="divide-y divide-[#DACDB3]/60">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || '/images/room-after.jpg'}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-contain bg-[#EAE2D2] p-1 border border-[#DACDB3] shrink-0"
                    />
                    <div>
                      <h3 className="font-serif text-sm font-medium text-[#362B21]">
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-[#544131]/70 font-sans">
                        {item.material || item.dimensions}
                      </p>
                      <span className="text-xs font-bold text-[#55694A] font-sans mt-0.5 block">
                        Qty: {item.quantity} &times; {formatINR(item.price)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-sans font-bold text-sm text-[#362B21] block">
                      {formatINR((item.price || 0) * (item.quantity || 1))}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Summary */}
            <div className="pt-4 border-t border-[#DACDB3] space-y-2 text-xs font-sans">
              <div className="flex justify-between text-[#544131]/80">
                <span>Subtotal:</span>
                <span className="font-medium text-[#362B21]">{formatINR(order.subtotal)}</span>
              </div>

              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Coupon Discount ({order.couponCode || 'APPLIED'}):</span>
                  <span>-{formatINR(order.couponDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#544131]/80">
                <span>Insured White-Glove Shipping:</span>
                <span className="text-emerald-700 font-bold">Complimentary (₹0)</span>
              </div>

              <div className="flex justify-between text-base font-bold text-[#362B21] pt-2 border-t border-[#DACDB3]">
                <span>Total Amount:</span>
                <span>{formatINR(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Client & Delivery Address */}
          <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-xl text-[#362B21] font-medium border-b border-[#DACDB3] pb-2">
              Client & Shipping Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#8F6E50] block">
                  Customer
                </span>
                <span className="font-medium text-sm text-[#362B21] block">
                  {order.shippingAddress?.fullName || `${order.userId?.firstName} ${order.userId?.lastName}`}
                </span>
                <span className="text-[#544131]/80 block font-mono">
                  {order.userId?.email || 'N/A'}
                </span>
                <span className="text-[#544131]/80 block">
                  Phone: {order.shippingAddress?.phone}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#8F6E50] block">
                  Delivery Address
                </span>
                <p className="text-[#362B21] leading-relaxed">
                  {order.shippingAddress?.addressLine1}
                  {order.shippingAddress?.addressLine2 && `, ${order.shippingAddress?.addressLine2}`}
                  <br />
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                  <br />
                  {order.shippingAddress?.country || 'India'}
                  {order.shippingAddress?.landmark && ` (Landmark: ${order.shippingAddress?.landmark})`}
                </p>
              </div>
            </div>
          </div>

          {/* Status Timeline History */}
          <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-xl text-[#362B21] font-medium border-b border-[#DACDB3] pb-2">
              Order Timeline & Audit Log
            </h2>

            <div className="space-y-3">
              {(order.statusHistory || []).map((h, i) => (
                <div key={i} className="flex items-start gap-3 text-xs font-sans">
                  <div className="w-2 h-2 rounded-full bg-[#55694A] mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-[#362B21]">
                        {h.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-[#544131]/60">
                        {new Date(h.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {h.note && (
                      <p className="text-[11px] text-[#544131]/80 mt-0.5">
                        {h.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Status Controls & Tracking */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Transition Control */}
          <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-xl text-[#362B21] font-medium border-b border-[#DACDB3] pb-2">
              Update Order Status
            </h2>

            {statusSuccess && (
              <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs">
                {statusSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#8F6E50] block">
                  Delivery Stage
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs uppercase font-bold text-[#362B21] focus:outline-none"
                >
                  {ORDER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#8F6E50] block">
                  Internal Status Note
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Dispatched via White-Glove Courier"
                  className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs text-[#362B21]"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingStatus}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] text-xs uppercase tracking-wider font-bold rounded-xl shadow-sm transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isUpdatingStatus ? 'Updating...' : 'Save Status Update'}</span>
              </button>
            </form>
          </div>

          {/* Shipment Tracking Information */}
          <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-xl text-[#362B21] font-medium border-b border-[#DACDB3] pb-2">
              Shipment Tracking Details
            </h2>

            {trackingSuccess && (
              <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs">
                {trackingSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateTracking} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#8F6E50] block">
                  Courier / Carrier Name
                </label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g. Blue Dart, Delhivery, DTDC"
                  className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs text-[#362B21]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#8F6E50] block">
                  Tracking / AWB Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. BDX-982347102"
                  className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs font-mono text-[#362B21]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#8F6E50] block">
                  Shipping Notes for Client
                </label>
                <input
                  type="text"
                  value={shippingNote}
                  onChange={(e) => setShippingNote(e.target.value)}
                  placeholder="e.g. Packed in moisture-resistant waterproof roll"
                  className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs text-[#362B21]"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingTracking}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#BA9977] hover:bg-[#A38361] text-[#FAF7F0] text-xs uppercase tracking-wider font-bold rounded-xl shadow-sm transition-all"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{isUpdatingTracking ? 'Saving...' : 'Save Tracking Information'}</span>
              </button>
            </form>
          </div>

          {/* Payment Details Card */}
          <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-5 sm:p-6 shadow-sm space-y-3 text-xs font-sans">
            <h2 className="font-serif text-xl text-[#362B21] font-medium border-b border-[#DACDB3] pb-2">
              Payment Record
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#8F6E50] font-bold">Method:</span>
                <span className="font-mono uppercase font-bold">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8F6E50] font-bold">Status:</span>
                <span className={`uppercase font-bold ${order.paymentStatus === 'completed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.razorpayPaymentId && (
                <div className="flex justify-between">
                  <span className="text-[#8F6E50] font-bold">Payment ID:</span>
                  <span className="font-mono text-[11px]">{order.razorpayPaymentId}</span>
                </div>
              )}
              {order.razorpayOrderId && (
                <div className="flex justify-between">
                  <span className="text-[#8F6E50] font-bold">Razorpay Order:</span>
                  <span className="font-mono text-[11px]">{order.razorpayOrderId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
