import React, { useState } from 'react';
import { 
  X, ShieldCheck, CheckCircle2, CreditCard, Banknote, 
  Smartphone, Truck, Phone, MessageSquare, ArrowRight, 
  Lock, Printer, Sparkles, MapPin
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { companyInfo } from '../../data/carpets';
import { ordersAPI } from '../../services/api';

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  items = [], 
  onOrderSuccess 
}) {
  const [step, setStep] = useState('details'); // 'details' | 'payment' | 'success'
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cod'
  const [onlineType, setOnlineType] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const [customer, setCustomer] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    landmark: '',
    city: '',
    state: 'Uttar Pradesh',
    pincode: ''
  });

  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const [upiId, setUpiId] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!customer.fullName || !customer.phone || !customer.address || !customer.pincode) {
      alert('Please fill in all mandatory delivery details.');
      return;
    }
    setStep('payment');
  };

  const handleCompleteOrder = async () => {
    setIsProcessing(true);

    try {
      const itemsPayload = items.map(item => ({
        productId: item.productId || item._id,
        id: item.slug || item.id,
        slug: item.slug || item.id,
        name: item.name,
        quantity: item.quantity || 1,
        selectedVariant: item.selectedVariant || ''
      }));

      const shippingAddress = {
        fullName: customer.fullName.trim(),
        phone: customer.phone.trim(),
        addressLine1: customer.address.trim(),
        addressLine2: (customer.landmark || '').trim(),
        city: customer.city.trim(),
        state: customer.state.trim(),
        postalCode: customer.pincode.trim(),
        country: 'India'
      };

      const res = await ordersAPI.createOrder({
        items: itemsPayload,
        shippingAddress,
        paymentMethod: 'cod'
      });

      if (res.success && res.order) {
        setCompletedOrder({
          orderId: res.order.orderNumber || res.order._id,
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          items: [...items],
          total: res.order.total || subtotal,
          customer: { ...customer },
          paymentMethod: 'Cash on Delivery (COD)'
        });
        setStep('success');

        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#D4BC9F', '#FAF7F0', '#6D8262', '#85997A']
          });
        } catch (e) {}

        if (onOrderSuccess) {
          onOrderSuccess(res.order);
        }
      } else {
        alert(res.message || 'Unable to place order. Please try checkout page.');
      }
    } catch (err) {
      alert(err.message || 'Order placement encountered an issue. Please sign in or use checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWhatsAppConfirm = () => {
    if (!completedOrder) return;
    const itemList = completedOrder.items.map(i => `• ${i.name} (Qty: ${i.quantity || 1}) - ₹${(i.price * (i.quantity || 1)).toLocaleString()}`).join('%0A');
    const msg = `*NEW ORDER CONFIRMATION - POTTERY RUGS & HOME DECOR*%0A%0A*Order ID:* ${completedOrder.orderId}%0A*Customer Name:* ${completedOrder.customer.fullName}%0A*Phone:* ${completedOrder.customer.phone}%0A*Address:* ${completedOrder.customer.address}, ${completedOrder.customer.city} - ${completedOrder.customer.pincode}%0A*Payment Method:* ${completedOrder.paymentMethod}%0A*Total Amount:* ₹${completedOrder.total.toLocaleString()}%0A%0A*Items Ordered:*%0A${itemList}%0A%0APlease confirm and dispatch this order.`;
    window.open(`https://wa.me/${companyInfo.whatsappNumber}?text=${msg}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    if (step === 'success') {
      setStep('details');
      setCompletedOrder(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        onClick={handleClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-4xl bg-[#45553C] text-[#FAF7F0] rounded-2xl border border-[#6D7F62] shadow-2xl overflow-hidden z-10 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#6D7F62]/60 flex items-center justify-between bg-[#3C4A34]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#D4BC9F]/50 flex-shrink-0 bg-[#FAF7F0] p-0.5">
              <img src={companyInfo.logo} alt="Pottery Rugs Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-[#FAF7F0] font-medium tracking-wide">
                {step === 'success' ? 'Order Confirmed' : 'Secure White-Glove Checkout'}
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-[#D4BC9F] font-sans font-bold">
                {companyInfo.name} &bull; {companyInfo.companyType}
              </p>
            </div>
          </div>

          <button 
            onClick={handleClose}
            className="p-2 text-[#FAF7F0]/70 hover:text-[#FAF7F0] transition-colors rounded-full hover:bg-[#48593F]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {step === 'details' && (
            <form onSubmit={handleProceedToPayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Delivery Details (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="border-b border-[#6D7F62]/50 pb-3">
                  <span className="text-[10px] uppercase tracking-widest text-[#D4BC9F] font-bold block mb-1">
                    Step 1 of 2
                  </span>
                  <h3 className="font-serif text-2xl text-[#FAF7F0] font-light">
                    Delivery & Customer Information
                  </h3>
                  <p className="text-xs text-[#FAF7F0]/80 mt-1 font-sans">
                    Complimentary insured delivery directly from our Bhadohi atelier to your doorstep.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1 font-bold">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Rajesh Kumar"
                      value={customer.fullName}
                      onChange={e => setCustomer({ ...customer, fullName: e.target.value })}
                      className="w-full bg-[#3C4A34] border border-[#6D7F62]/60 rounded-lg px-4 py-2.5 text-xs text-[#FAF7F0] placeholder:text-[#FAF7F0]/40 focus:border-[#D4BC9F] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1 font-bold">
                      Contact Number *
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={customer.phone}
                      onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full bg-[#3C4A34] border border-[#6D7F62]/60 rounded-lg px-4 py-2.5 text-xs text-[#FAF7F0] placeholder:text-[#FAF7F0]/40 focus:border-[#D4BC9F] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1 font-bold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="name@domain.com"
                      value={customer.email}
                      onChange={e => setCustomer({ ...customer, email: e.target.value })}
                      className="w-full bg-[#3C4A34] border border-[#6D7F62]/60 rounded-lg px-4 py-2.5 text-xs text-[#FAF7F0] placeholder:text-[#FAF7F0]/40 focus:border-[#D4BC9F] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1 font-bold">
                      Complete Shipping Address *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="House / Flat No., Apartment / Villa Name, Street Address"
                      value={customer.address}
                      onChange={e => setCustomer({ ...customer, address: e.target.value })}
                      className="w-full bg-[#3C4A34] border border-[#6D7F62]/60 rounded-lg px-4 py-2 text-xs text-[#FAF7F0] placeholder:text-[#FAF7F0]/40 focus:border-[#D4BC9F] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1 font-bold">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Near City Center / Park"
                      value={customer.landmark}
                      onChange={e => setCustomer({ ...customer, landmark: e.target.value })}
                      className="w-full bg-[#3C4A34] border border-[#6D7F62]/60 rounded-lg px-4 py-2.5 text-xs text-[#FAF7F0] placeholder:text-[#FAF7F0]/40 focus:border-[#D4BC9F] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1 font-bold">
                      Pincode *
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 221301 or your area pin"
                      value={customer.pincode}
                      onChange={e => setCustomer({ ...customer, pincode: e.target.value })}
                      className="w-full bg-[#3C4A34] border border-[#6D7F62]/60 rounded-lg px-4 py-2.5 text-xs text-[#FAF7F0] placeholder:text-[#FAF7F0]/40 focus:border-[#D4BC9F] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1 font-bold">
                      City / District *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="City Name"
                      value={customer.city}
                      onChange={e => setCustomer({ ...customer, city: e.target.value })}
                      className="w-full bg-[#3C4A34] border border-[#6D7F62]/60 rounded-lg px-4 py-2.5 text-xs text-[#FAF7F0] placeholder:text-[#FAF7F0]/40 focus:border-[#D4BC9F] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1 font-bold">
                      State *
                    </label>
                    <select
                      value={customer.state}
                      onChange={e => setCustomer({ ...customer, state: e.target.value })}
                      className="w-full bg-[#3C4A34] border border-[#6D7F62]/60 rounded-lg px-3 py-2.5 text-xs text-[#FAF7F0] focus:border-[#D4BC9F] focus:outline-none"
                    >
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Delhi NCR">Delhi NCR</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Other States">Other States / UTs</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full bg-[#5D7053] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold py-3.5 px-6 rounded-lg text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group shadow-xl border border-[#85997A]/60"
                  >
                    <span>Proceed to Payment Method (Online / COD)</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Order Summary (5 cols) */}
              <div className="lg:col-span-5 bg-[#3C4A34] p-5 sm:p-6 rounded-xl border border-[#6D7F62]/60 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="font-serif text-lg text-[#FAF7F0] border-b border-[#6D7F62]/40 pb-2.5 font-medium">
                    Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </h4>

                  <div className="max-h-60 overflow-y-auto divide-y divide-[#6D7F62]/30 pr-1">
                    {items.map((item) => (
                      <div key={item.id} className="py-3 flex gap-3">
                        <div className="w-14 h-14 bg-[#45553C] rounded overflow-hidden flex-shrink-0 border border-[#6D7F62]/50">
                          <img src={item.image || item.texture} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-serif text-xs text-[#FAF7F0] truncate font-medium">{item.name}</h5>
                          <p className="text-[11px] text-[#D4BC9F] truncate">{item.dimensions || item.category}</p>
                          <div className="flex justify-between items-center mt-1 text-xs">
                            <span className="text-[#FAF7F0]/70">Qty: {item.quantity || 1}</span>
                            <span className="font-sans font-bold text-[#D4BC9F]">₹{((item.price) * (item.quantity || 1)).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#6D7F62]/40 space-y-2 text-xs">
                    <div className="flex justify-between text-[#FAF7F0]/80">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#D4BC9F]">
                      <span>White-Glove Insured Delivery</span>
                      <span className="font-bold uppercase tracking-wider">FREE</span>
                    </div>
                    <div className="flex justify-between text-[#FAF7F0]/80">
                      <span>Price</span>
                      <span>Manufacturer Direct</span>
                    </div>
                    <div className="pt-2 border-t border-[#6D7F62]/40 flex justify-between text-base font-serif text-[#FAF7F0] font-medium">
                      <span>Total Amount</span>
                      <span className="font-sans font-bold text-lg text-[#D4BC9F]">₹{subtotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded bg-[#45553C]/60 border border-[#6D7F62]/40 text-[11px] text-[#D4BC9F] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#FAF7F0]">
                    <ShieldCheck className="w-4 h-4 text-[#D4BC9F]" />
                    <span>Direct from Bhadohi Weavers</span>
                  </div>
                  <p className="text-[#FAF7F0]/75">
                    Certified Authentic Indian Craftsmanship. Need help? Call: {companyInfo.phoneDisplay}
                  </p>
                </div>
              </div>
            </form>
          )}

          {step === 'payment' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Payment Selector (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="text-xs text-[#D4BC9F] hover:underline font-bold mb-2 inline-block"
                  >
                    &larr; Back to Delivery Details
                  </button>
                  <span className="text-[10px] uppercase tracking-widest text-[#D4BC9F] font-bold block">
                    Step 2 of 2
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-[#FAF7F0] font-light">
                    Select Payment Method
                  </h3>
                  <p className="text-xs text-[#FAF7F0]/80 mt-1 font-sans">
                    Choose between seamless instant Online Payment or Cash on Delivery (COD).
                  </p>
                </div>

                {/* Method Tabs */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setPaymentMethod('online')}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${
                      paymentMethod === 'online'
                        ? 'bg-[#5D7053] border-[#D4BC9F] shadow-lg text-[#FAF7F0]'
                        : 'bg-[#3C4A34] border-[#6D7F62]/60 text-[#FAF7F0]/80 hover:bg-[#48593F]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <CreditCard className="w-5 h-5 text-[#D4BC9F]" />
                      <span className="font-serif text-base font-medium">Online Payment</span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-85">
                      UPI, Cards, NetBanking. Fast, zero extra charges.
                    </p>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${
                      paymentMethod === 'cod'
                        ? 'bg-[#5D7053] border-[#D4BC9F] shadow-lg text-[#FAF7F0]'
                        : 'bg-[#3C4A34] border-[#6D7F62]/60 text-[#FAF7F0]/80 hover:bg-[#48593F]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Banknote className="w-5 h-5 text-[#D4BC9F]" />
                      <span className="font-serif text-base font-medium">Cash On Delivery</span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-85">
                      Pay with cash or UPI when carpet arrives at your home.
                    </p>
                  </div>
                </div>

                {/* Online Payment Detailed Form */}
                {paymentMethod === 'online' && (
                  <div className="p-5 bg-[#3C4A34] rounded-xl border border-[#6D7F62]/60 space-y-4">
                    <div className="flex gap-2 border-b border-[#6D7F62]/40 pb-3">
                      <button
                        type="button"
                        onClick={() => setOnlineType('upi')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                          onlineType === 'upi' ? 'bg-[#5D7053] text-[#FAF7F0]' : 'text-[#FAF7F0]/70 hover:text-[#FAF7F0]'
                        }`}
                      >
                        UPI (GPay / PhonePe / Paytm)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOnlineType('card')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                          onlineType === 'card' ? 'bg-[#5D7053] text-[#FAF7F0]' : 'text-[#FAF7F0]/70 hover:text-[#FAF7F0]'
                        }`}
                      >
                        Debit / Credit Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setOnlineType('netbanking')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                          onlineType === 'netbanking' ? 'bg-[#5D7053] text-[#FAF7F0]' : 'text-[#FAF7F0]/70 hover:text-[#FAF7F0]'
                        }`}
                      >
                        NetBanking
                      </button>
                    </div>

                    {onlineType === 'upi' && (
                      <div className="space-y-3">
                        <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] font-bold">
                          Enter UPI ID / VPA
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="yourname@okhdfcbank / mobile@upi"
                            value={upiId}
                            onChange={e => setUpiId(e.target.value)}
                            className="flex-1 bg-[#45553C] border border-[#6D7F62] rounded-lg px-4 py-2.5 text-xs text-[#FAF7F0] focus:border-[#D4BC9F] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setUpiId('9839116625@upi')}
                            className="text-[11px] bg-[#526449] hover:bg-[#607555] px-3 py-2 rounded text-[#FAF7F0] border border-[#6D7F62]"
                          >
                            Use Demo UPI
                          </button>
                        </div>
                        <p className="text-[11px] text-[#FAF7F0]/70">
                          A payment collect request will be sent to your UPI app, or scan the official QR upon placement.
                        </p>
                      </div>
                    )}

                    {onlineType === 'card' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1 font-bold">
                            Card Number
                          </label>
                          <input
                            type="text"
                            placeholder="4532 •••• •••• 8921"
                            value={cardDetails.number}
                            onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })}
                            className="w-full bg-[#45553C] border border-[#6D7F62] rounded-lg px-4 py-2 text-xs text-[#FAF7F0] focus:border-[#D4BC9F] focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1 font-bold">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              placeholder="MM / YY"
                              value={cardDetails.expiry}
                              onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                              className="w-full bg-[#45553C] border border-[#6D7F62] rounded-lg px-4 py-2 text-xs text-[#FAF7F0] focus:border-[#D4BC9F] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1 font-bold">
                              CVV
                            </label>
                            <input
                              type="password"
                              maxLength={4}
                              placeholder="•••"
                              value={cardDetails.cvv}
                              onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                              className="w-full bg-[#45553C] border border-[#6D7F62] rounded-lg px-4 py-2 text-xs text-[#FAF7F0] focus:border-[#D4BC9F] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {onlineType === 'netbanking' && (
                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] font-bold">
                          Select Popular Bank
                        </label>
                        <select className="w-full bg-[#45553C] border border-[#6D7F62] rounded-lg px-3 py-2.5 text-xs text-[#FAF7F0] focus:border-[#D4BC9F] focus:outline-none">
                          <option>State Bank of India (SBI)</option>
                          <option>HDFC Bank</option>
                          <option>ICICI Bank</option>
                          <option>Axis Bank</option>
                          <option>Kotak Mahindra Bank</option>
                          <option>Punjab National Bank</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* COD Details */}
                {paymentMethod === 'cod' && (
                  <div className="p-5 bg-[#3C4A34] rounded-xl border border-[#6D7F62]/60 space-y-3">
                    <div className="flex items-center gap-2 text-[#D4BC9F] font-bold text-xs">
                      <Truck className="w-5 h-5 text-[#D4BC9F]" />
                      <span>Cash On Delivery (COD) Policy</span>
                    </div>
                    <ul className="text-xs text-[#FAF7F0]/85 space-y-1.5 list-disc list-inside">
                      <li>Pay directly to the courier agent when your rug arrives at your doorstep.</li>
                      <li>Payment accepted in <strong>Cash or via QR Code / UPI</strong> at the time of delivery.</li>
                      <li>Free in-home inspection before final handover.</li>
                      <li>No advance prepayment required.</li>
                    </ul>
                  </div>
                )}

                {/* Action CTA */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCompleteOrder}
                  className="w-full bg-[#5D7053] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold py-4 px-6 rounded-lg text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group shadow-xl border border-[#85997A]/60"
                >
                  {isProcessing ? (
                    <span>Placing Your Order...</span>
                  ) : paymentMethod === 'online' ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Authorize & Pay ₹{subtotal.toLocaleString()} Online</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Cash on Delivery Order &bull; ₹{subtotal.toLocaleString()}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Delivery Recap (5 cols) */}
              <div className="lg:col-span-5 bg-[#3C4A34] p-5 sm:p-6 rounded-xl border border-[#6D7F62]/60 space-y-4">
                <h4 className="font-serif text-lg text-[#FAF7F0] border-b border-[#6D7F62]/40 pb-2 font-medium">
                  Dispatch Summary
                </h4>

                <div className="text-xs space-y-2.5 text-[#FAF7F0]/90">
                  <div>
                    <span className="text-[#D4BC9F] block text-[10px] uppercase tracking-wider font-bold">Recipient</span>
                    <p className="font-medium text-[#FAF7F0]">{customer.fullName} &bull; {customer.phone}</p>
                  </div>
                  <div>
                    <span className="text-[#D4BC9F] block text-[10px] uppercase tracking-wider font-bold">Shipping Address</span>
                    <p className="font-normal text-[#FAF7F0]/80">
                      {customer.address}, {customer.landmark ? `${customer.landmark}, ` : ''}{customer.city}, {customer.state} - {customer.pincode}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#D4BC9F] block text-[10px] uppercase tracking-wider font-bold">Selected Payment</span>
                    <p className="font-medium text-[#FAF7F0]">
                      {paymentMethod === 'online' ? `Online Payment (${onlineType.toUpperCase()})` : 'Cash on Delivery (COD)'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#6D7F62]/40 space-y-1.5 text-xs">
                  <div className="flex justify-between text-base font-serif text-[#FAF7F0] font-medium">
                    <span>Payable Total</span>
                    <span className="font-sans font-bold text-lg text-[#D4BC9F]">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-[#FAF7F0]/60">All taxes and insured express dispatch included.</p>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && completedOrder && (
            <div className="max-w-2xl mx-auto py-4 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#5D7053] border-2 border-[#D4BC9F] mx-auto flex items-center justify-center text-[#FAF7F0] shadow-xl">
                <CheckCircle2 className="w-9 h-9 text-[#D4BC9F]" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-[#D4BC9F] font-bold block mb-1">
                  ORDER PLACED SUCCESSFULLY
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl text-[#FAF7F0] font-light">
                  Thank You for Your Order
                </h3>
                <p className="text-xs sm:text-sm font-sans text-[#FAF7F0]/85 max-w-lg mx-auto mt-2 leading-relaxed font-normal">
                  Your piece is being prepared for insured dispatch from our workshop in Bhadohi, Uttar Pradesh.
                </p>
              </div>

              {/* Order Card */}
              <div className="p-6 bg-[#3C4A34] rounded-xl border border-[#6D7F62] text-left space-y-4 shadow-lg text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#6D7F62]/50 gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#D4BC9F] font-bold block">Order Reference</span>
                    <span className="font-mono text-sm font-bold text-[#FAF7F0]">{completedOrder.orderId}</span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[10px] uppercase tracking-wider text-[#D4BC9F] font-bold block">Payment Mode</span>
                    <span className="font-sans text-xs text-[#FAF7F0] font-bold">{completedOrder.paymentMethod}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#D4BC9F] font-bold block">Items</span>
                  {completedOrder.items.map((it) => (
                    <div key={it.id} className="flex justify-between items-center text-[#FAF7F0]/90">
                      <span>{it.name} &times; {it.quantity || 1}</span>
                      <span className="font-sans font-bold text-[#D4BC9F]">₹{((it.price) * (it.quantity || 1)).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#6D7F62]/50 flex justify-between items-center font-bold text-sm">
                  <span className="text-[#FAF7F0]">Total Amount:</span>
                  <span className="font-sans text-lg text-[#D4BC9F]">₹{completedOrder.total.toLocaleString()}</span>
                </div>

                <div className="pt-2 border-t border-[#6D7F62]/40 text-[11px] text-[#FAF7F0]/80">
                  <strong>Delivery To:</strong> {completedOrder.customer.fullName}, {completedOrder.customer.address}, {completedOrder.customer.city} - {completedOrder.customer.pincode} (Tel: {completedOrder.customer.phone})
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleWhatsAppConfirm}
                  className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20ba59] text-white font-sans font-bold py-3.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Order to WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full sm:w-auto bg-[#3C4A34] hover:bg-[#48593F] text-[#FAF7F0] font-sans font-bold py-3.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-[#6D7F62]"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto bg-[#5D7053] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold py-3.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-all"
                >
                  <span>Continue Shopping</span>
                </button>
              </div>

              {/* Direct Help */}
              <div className="pt-4 border-t border-[#6D7F62]/40 text-xs text-[#D4BC9F] flex flex-wrap items-center justify-center gap-4 font-medium">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  Direct Helplines: 
                  <a href={`tel:${companyInfo.phone1}`} className="underline hover:text-white">{companyInfo.phone1}</a>, 
                  <a href={`tel:${companyInfo.phone2}`} className="underline hover:text-white">{companyInfo.phone2}</a>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {companyInfo.address}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
