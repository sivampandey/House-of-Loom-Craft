import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, MessageSquare, Printer, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import SEO from '../components/common/SEO';
import { ordersAPI } from '../services/api';
import { companyInfo } from '../data/carpets';

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#55694A', '#D4BC9F', '#FAF7F0', '#362B21']
      });
    } catch (e) {}

    const fetchOrder = async () => {
      try {
        const res = await ordersAPI.getOrderById(orderId);
        if (res.success && res.order) {
          setOrder(res.order);
        }
      } catch (err) {
        console.error('Failed to load confirmed order', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const whatsappConfirmMsg = order ? encodeURIComponent(
    `*NEW ORDER CONFIRMATION - HOUSE OF LOOM & CRAFT*\n\n*Order ID:* ${order.orderNumber}\n*Customer:* ${order.shippingAddress?.fullName}\n*Phone:* ${order.shippingAddress?.phone}\n*Address:* ${order.shippingAddress?.addressLine1}, ${order.shippingAddress?.city} - ${order.shippingAddress?.postalCode}\n*Total:* ₹${order.total?.toLocaleString()}\n*Payment Method:* ${order.paymentMethod === 'online' ? 'Online Payment (Verified)' : 'Cash on Delivery'}\n\nPlease proceed with order verification and delivery packaging.`
  ) : '';

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-28 sm:pt-36 pb-24 flex items-center justify-center px-4">
      <SEO
        title="Order Confirmed | House of Loom & Craft"
        description="Your handcrafted rug order has been confirmed at House of Loom & Craft."
        path={`/order-success/${orderId}`}
      />

      <div className="w-full max-w-2xl bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-8 sm:p-12 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#55694A] text-[#FAF7F0] flex items-center justify-center mx-auto shadow-lg ring-8 ring-[#55694A]/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
            ORDER CONFIRMED
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light">
            Thank You for Your Order
          </h1>
          <p className="text-xs sm:text-sm text-[#4E3C2B] max-w-md mx-auto leading-relaxed">
            Your order has been placed successfully. Our team in Bhadohi has initiated packaging and preparation for delivery.
          </p>
        </div>

        {/* Order Reference Badge */}
        <div className="p-6 rounded-2xl bg-[#FAF7F0] border border-[#DACDB3] max-w-md mx-auto space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-[#4E3C2B]/70 font-sans block">
            Order Number
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-[#55694A] block">
            {order?.orderNumber || orderId}
          </span>
          {order && (
            <p className="text-xs text-[#4E3C2B]">
              Total: <strong className="text-[#362B21]">₹{order.total?.toLocaleString()}</strong> · Method: <span className="capitalize">{order.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}</span>
            </p>
          )}
        </div>

        {/* Action Links */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <Link
            to={`/orders/${order?.orderNumber || orderId}`}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] text-xs uppercase tracking-widest font-sans font-bold rounded-full transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <span>View Order Details</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/collections"
            className="w-full sm:w-auto px-6 py-3.5 bg-[#FAF7F0] hover:bg-[#EFE8D8] text-[#362B21] border border-[#DACDB3] text-xs uppercase tracking-widest font-sans font-bold rounded-full transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        {/* WhatsApp Direct Dispatch Notification */}
        {order && (
          <div className="pt-4 border-t border-[#DACDB3]/70">
            <a
              href={`https://wa.me/${companyInfo.whatsappNumber}?text=${whatsappConfirmMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-sans font-bold text-[#55694A] hover:underline"
            >
              <MessageSquare className="w-4 h-4 text-[#25D366]" />
              <span>Send order confirmation via WhatsApp</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
