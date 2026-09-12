import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Printer, ShieldCheck, Truck, CheckCircle2, 
  Clock, Package, AlertCircle, MessageSquare, XCircle, Phone 
} from 'lucide-react';
import SEO from '../components/common/SEO';
import { ordersAPI } from '../services/api';
import { companyInfo } from '../data/carpets';

export default function OrderDetailPage({ onShowToast }) {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await ordersAPI.getOrderById(orderId);
        if (res.success && res.order) {
          setOrder(res.order);
        } else {
          setError(res.message || 'Order record not found.');
        }
      } catch (err) {
        setError(err.message || 'Unable to access order record.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you certain you wish to cancel this acquisition?')) return;
    setCancelling(true);
    try {
      const res = await ordersAPI.cancelOrder(order.orderNumber || order._id, 'Cancelled by client request');
      if (res.success && res.order) {
        setOrder(res.order);
        if (onShowToast) {
          onShowToast('cart', 'Order Cancelled', 'Your acquisition cancellation has been logged.');
        }
      }
    } catch (err) {
      if (onShowToast) onShowToast('error', 'Error', err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center pt-24">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#55694A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-sm tracking-widest text-[#4E3C2B] uppercase">Retrieving Atelier Order Archive...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center pt-24 px-4">
        <div className="text-center space-y-4 max-w-md p-10 bg-[#EFE8D8] rounded-3xl border border-[#DACDB3]">
          <AlertCircle className="w-12 h-12 text-red-800 mx-auto" />
          <h2 className="font-serif text-2xl text-[#362B21]">Unable to Locate Order</h2>
          <p className="text-xs text-[#4E3C2B] leading-relaxed">{error || 'This order reference does not belong to your client account.'}</p>
          <Link
            to="/orders"
            className="inline-block px-6 py-2.5 bg-[#55694A] text-[#FAF7F0] text-xs uppercase tracking-widest font-bold rounded-full mt-2"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  // Timeline Steps Calculation
  const timelineSteps = [
    { key: 'confirmed', title: 'Order Confirmed', desc: 'Acquisition validated & logged at Bhadohi atelier' },
    { key: 'processing', title: 'Crafting / Preparation', desc: 'Heirloom quality inspection & white-glove wrapping' },
    { key: 'shipped', title: 'Dispatched from Atelier', desc: 'En route with insured art freight logistics' },
    { key: 'out_for_delivery', title: 'Out for White-Glove Delivery', desc: 'Scheduled courier courier arrival' },
    { key: 'delivered', title: 'Delivered to Residence', desc: 'Installed and placed in your living sanctuary' }
  ];

  const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
  const currentIndex = statusOrder.indexOf(order.orderStatus);

  const isCancellable = ['pending', 'confirmed'].includes(order.orderStatus);

  const whatsappInquiryMsg = encodeURIComponent(
    `Hello Pottery Rugs Atelier,\n\nI am inquiring about my order *#${order.orderNumber}* placed on ${new Date(order.createdAt).toLocaleDateString('en-IN')}.\nCurrent Status: ${order.orderStatus}.\nPlease assist with white-glove tracking updates.`
  );

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-28 sm:pt-32 pb-24">
      <SEO
        title={`Order #${order.orderNumber} | Pottery Rugs & Home Decor`}
        description={`Order details and delivery timeline for ${order.orderNumber}.`}
        path={`/orders/${order.orderNumber}`}
      />

      {/* PRINT-ONLY INVOICE SECTION (visible only on @media print) */}
      <div className="hidden print:block p-8 bg-white text-black max-w-4xl mx-auto font-serif">
        <div className="border-b-2 border-black pb-6 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-widest uppercase">POTTERY RUGS & HOME DECOR</h1>
            <p className="text-xs uppercase tracking-wider font-sans mt-1">Manufacturer & Exporter · Bhadohi 221301 U.P. (India)</p>
            <p className="text-xs font-sans">Helpline: +91 9839116625 · info@potteryrugs.com</p>
          </div>
          <div className="text-right font-sans text-xs">
            <p className="font-bold text-base font-serif">ATELIER INVOICE</p>
            <p><strong>Order No:</strong> {order.orderNumber}</p>
            <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
            <p><strong>Status:</strong> {order.orderStatus.toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 font-sans text-xs mb-8">
          <div>
            <h3 className="font-bold uppercase tracking-wider mb-1 font-serif">Bill & Ship To:</h3>
            <p className="font-bold">{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.phone}</p>
            <p>{order.shippingAddress?.addressLine1} {order.shippingAddress?.addressLine2}</p>
            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}</p>
            <p>{order.shippingAddress?.country}</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold uppercase tracking-wider mb-1 font-serif">Payment Method:</h3>
            <p className="capitalize">{order.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery (COD)'}</p>
            <p><strong>Payment Status:</strong> {order.paymentStatus.toUpperCase()}</p>
            {order.razorpayPaymentId && <p><strong>Payment ID:</strong> {order.razorpayPaymentId}</p>}
          </div>
        </div>

        <table className="w-full font-sans text-xs mb-6 border-collapse">
          <thead>
            <tr className="border-b-2 border-black text-left font-serif">
              <th className="py-2">Heirloom Piece Description</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Unit Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, i) => (
              <tr key={i} className="border-b border-gray-300">
                <td className="py-3">
                  <p className="font-bold font-serif text-sm">{item.name}</p>
                  <p className="text-[10px] text-gray-600">{item.dimensions} · {item.material}</p>
                </td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">₹{item.price?.toLocaleString()}</td>
                <td className="py-3 text-right">₹{(item.price * item.quantity)?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end font-sans text-xs">
          <div className="w-64 space-y-1.5 border-t border-black pt-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{order.subtotal?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Insured Freight:</span>
              <span>Complimentary</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-black pt-2 font-serif">
              <span>Grand Total:</span>
              <span>₹{order.total?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* WEB VIEW (Hidden when printing) */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 print:hidden">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5 text-xs uppercase tracking-widest text-[#55694A] font-sans font-bold">
            <Link to="/orders" className="hover:text-[#362B21] transition-colors flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              All Orders
            </Link>
            <span className="text-[#DACDB3]">/</span>
            <span className="text-[#362B21]">{order.orderNumber}</span>
          </div>

          <button
            onClick={handlePrintInvoice}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF7F0] border border-[#DACDB3] hover:bg-[#EFE8D8] text-xs uppercase tracking-wider font-sans font-bold text-[#362B21] transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-[#55694A]" />
            <span>Print Invoice</span>
          </button>
        </div>

        {/* Order Header Summary */}
        <div className="bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-8 mb-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#DACDB3]/70">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#55694A] font-bold block">
                OFFICIAL ATELIER ORDER RECORD
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light mt-1">
                Order #{order.orderNumber}
              </h1>
              <p className="text-xs text-[#4E3C2B] mt-1 font-sans">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs uppercase tracking-widest text-[#4E3C2B]/70 block font-sans">
                Grand Total Investment
              </span>
              <span className="font-sans text-3xl font-bold text-[#362B21]">
                ₹{(order.total || 0).toLocaleString()}
              </span>
              <span className="text-[11px] text-[#55694A] block capitalize font-medium mt-0.5">
                {order.paymentMethod === 'online' ? 'Online Payment (Verified)' : 'Cash on Delivery (Pending)'}
              </span>
            </div>
          </div>

          {/* Luxury Timeline */}
          {order.orderStatus === 'cancelled' ? (
            <div className="pt-6 flex items-center gap-3 text-red-900 bg-red-900/10 p-4 rounded-2xl border border-red-800/20">
              <XCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <h3 className="font-serif text-lg font-bold">Acquisition Cancelled</h3>
                <p className="text-xs text-red-950/80">
                  This order was cancelled on client request. Restored pieces have been returned to the atelier repertoire.
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-8">
              <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold block mb-6">
                DISPATCH & LOOM TIMELINE
              </span>

              <div className="relative">
                {/* Horizontal progress bar for desktop */}
                <div className="hidden md:block absolute top-5 left-6 right-6 h-[2px] bg-[#DACDB3]" />

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
                  {timelineSteps.map((step, idx) => {
                    const isPassed = currentIndex >= idx;
                    const isCurrent = currentIndex === idx;

                    return (
                      <div key={step.key} className="flex md:flex-col items-start gap-4 md:gap-2">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors flex-shrink-0 border ${
                            isCurrent
                              ? 'bg-[#55694A] text-[#FAF7F0] border-[#55694A] shadow-md ring-4 ring-[#55694A]/20'
                              : isPassed
                              ? 'bg-[#55694A] text-[#FAF7F0] border-[#55694A]'
                              : 'bg-[#FAF7F0] text-[#4E3C2B]/50 border-[#DACDB3]'
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>

                        <div>
                          <p className={`font-serif text-sm font-medium ${isPassed ? 'text-[#362B21]' : 'text-[#4E3C2B]/60'}`}>
                            {step.title}
                          </p>
                          <p className="text-[10px] text-[#4E3C2B] leading-relaxed mt-0.5">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Details Grid: Items (Left 7 cols) & Address/Summary (Right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items Purchased (7 cols) */}
          <div className="lg:col-span-7 bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-6 sm:p-8 space-y-6">
            <h3 className="font-serif text-2xl text-[#362B21] font-light">Acquired Masterpieces</h3>

            <div className="divide-y divide-[#DACDB3]/60">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#3C4A34] flex-shrink-0 border border-[#DACDB3]">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif text-base text-[#362B21] font-medium leading-snug">
                        {item.name}
                      </h4>
                      <p className="text-xs text-[#55694A] mt-0.5">{item.dimensions || 'Atelier Dimensions'}</p>
                      {item.material && <p className="text-[11px] text-[#4E3C2B]">{item.material}</p>}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-[#4E3C2B]">Quantity: <strong>{item.quantity}</strong></span>
                      <span className="font-sans font-bold text-sm text-[#362B21]">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cancel Action if applicable */}
            {isCancellable && (
              <div className="pt-6 border-t border-[#DACDB3]/70 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#362B21] block">Change of Mind?</span>
                  <span className="text-[11px] text-[#4E3C2B]">Cancellations are accepted prior to master loom dispatch.</span>
                </div>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-4 py-2 border border-red-800/40 text-red-900 hover:bg-red-900/10 text-xs uppercase tracking-wider font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            )}
          </div>

          {/* Delivery Residence & Financial Breakdown (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Delivery Address */}
            <div className="bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-6 space-y-3">
              <h3 className="font-serif text-xl text-[#362B21] font-medium flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#55694A]" />
                Delivery Residence
              </h3>
              <div className="text-xs text-[#4E3C2B] space-y-1 leading-relaxed bg-[#FAF7F0] p-4 rounded-2xl border border-[#DACDB3]/70">
                <p className="font-bold text-[#362B21]">{order.shippingAddress?.fullName}</p>
                <p className="font-mono">{order.shippingAddress?.phone}</p>
                <p>{order.shippingAddress?.addressLine1} {order.shippingAddress?.addressLine2}</p>
                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}</p>
                <p>{order.shippingAddress?.country}</p>
                {order.shippingAddress?.landmark && (
                  <p className="italic text-[#55694A]">Landmark: {order.shippingAddress.landmark}</p>
                )}
              </div>
            </div>

            {/* Financial Ledger */}
            <div className="bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-6 space-y-3">
              <h3 className="font-serif text-xl text-[#362B21] font-medium">Financial Summary</h3>
              <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#DACDB3]/70 space-y-2 text-xs">
                <div className="flex justify-between text-[#4E3C2B]">
                  <span>Atelier Subtotal</span>
                  <span className="font-bold text-[#362B21]">₹{order.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#55694A]">
                  <span>Insured White-Glove Freight</span>
                  <span className="uppercase font-bold tracking-wider">Complimentary</span>
                </div>
                <div className="flex justify-between text-[#4E3C2B]">
                  <span>Customs & Regional Tax</span>
                  <span className="uppercase font-bold tracking-wider">Included</span>
                </div>

                <div className="pt-2 border-t border-[#DACDB3] flex justify-between text-base font-bold text-[#362B21]">
                  <span className="font-serif">Grand Total</span>
                  <span className="font-sans">₹{order.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Concierge Support CTA */}
            <div className="bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-6 space-y-3 text-center">
              <p className="text-xs text-[#4E3C2B] leading-relaxed">
                Have questions regarding custom loom adjustments, insurance certificates, or delivery timings?
              </p>
              <a
                href={`https://wa.me/${companyInfo.whatsappNumber}?text=${whatsappInquiryMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] flex items-center justify-center gap-2 text-xs font-sans font-bold uppercase tracking-wider transition-colors shadow-md"
              >
                <MessageSquare className="w-4 h-4 text-[#25D366]" />
                <span>Contact Atelier Concierge</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
