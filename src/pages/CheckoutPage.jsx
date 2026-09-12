import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Truck, CreditCard, Banknote, 
  MapPin, ArrowRight, ArrowLeft, Check, Lock, Sparkles 
} from 'lucide-react';
import SEO from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ordersAPI, paymentsAPI, usersAPI } from '../services/api';
import { companyInfo } from '../data/carpets';

export default function CheckoutPage({ onShowToast }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cartItems, clearCart, subtotal } = useCart();

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/collections');
    }
  }, [cartItems, navigate]);

  // Saved addresses from user
  const [savedAddresses, setSavedAddresses] = useState(user?.addresses || []);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [useNewAddress, setUseNewAddress] = useState(!user?.addresses?.length);

  // Address form
  const [addressForm, setAddressForm] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Uttar Pradesh',
    postalCode: '',
    country: 'India',
    landmark: ''
  });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'online' | 'cod'
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Prefill primary address
  useEffect(() => {
    if (user?.addresses?.length) {
      setSavedAddresses(user.addresses);
      const defIdx = user.addresses.findIndex(a => a.isDefault);
      setSelectedAddressIndex(defIdx > -1 ? defIdx : 0);
      setUseNewAddress(false);
    }
  }, [user]);

  const getChosenAddress = () => {
    if (!useNewAddress && savedAddresses[selectedAddressIndex]) {
      return savedAddresses[selectedAddressIndex];
    }
    return addressForm;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    const chosenAddress = getChosenAddress();

    if (!chosenAddress.fullName || !chosenAddress.phone || !chosenAddress.addressLine1 || !chosenAddress.city || !chosenAddress.postalCode) {
      setError('Please provide all required delivery address fields.');
      return;
    }

    setProcessing(true);

    try {
      const itemsPayload = cartItems.map(item => ({
        productId: item.productId || item._id,
        id: item.slug || item.id,
        slug: item.slug || item.id,
        name: item.name,
        quantity: item.quantity || 1,
        selectedVariant: item.selectedVariant || ''
      }));

      // ================= PAYMENT FLOW =================
      if (paymentMethod === 'online') {
        // Step 1: Create Razorpay Order via Backend
        const razorpayOrderRes = await paymentsAPI.createOrder(itemsPayload);

        if (!razorpayOrderRes.success) {
          throw new Error(razorpayOrderRes.message || 'Unable to initiate online payment.');
        }

        // If backend explicitly flagged that simulation is active in development:
        if (razorpayOrderRes.isSimulated) {
          const verifyRes = await paymentsAPI.verifyPayment({
            razorpayOrderId: razorpayOrderRes.orderId,
            razorpayPaymentId: `pay_sim_${Date.now()}`,
            razorpaySignature: 'simulated_signature',
            items: itemsPayload,
            shippingAddress: chosenAddress
          });

          if (verifyRes.success && verifyRes.order) {
            await clearCart();
            navigate(`/order-success/${verifyRes.order.orderNumber || verifyRes.order._id}`);
            return;
          } else {
            throw new Error(verifyRes.message || 'Simulated transaction could not be verified.');
          }
        }

        // Live Gateway Flow: Razorpay SDK must be loaded on the window
        if (!window.Razorpay) {
          throw new Error('Razorpay payment gateway could not be loaded. Please check your internet connection or disable ad-blockers and try again.');
        }

        const options = {
          key: razorpayOrderRes.keyId,
          amount: razorpayOrderRes.amount,
          currency: razorpayOrderRes.currency || 'INR',
          name: 'POTTERY RUGS & HOME DECOR',
          description: `Atelier Acquisition (${itemsPayload.length} Pieces)`,
          image: '/images/pottery-logo.jpg',
          order_id: razorpayOrderRes.orderId,
          handler: async function (response) {
            try {
              const verifyRes = await paymentsAPI.verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                items: itemsPayload,
                shippingAddress: chosenAddress
              });

              if (verifyRes.success && verifyRes.order) {
                await clearCart();
                navigate(`/order-success/${verifyRes.order.orderNumber || verifyRes.order._id}`);
              } else {
                throw new Error(verifyRes.message || 'Payment verification was unsuccessful.');
              }
            } catch (err) {
              setError(err.message || 'Payment signature verification failed.');
              setProcessing(false);
            }
          },
          prefill: {
            name: chosenAddress.fullName,
            email: user?.email || '',
            contact: chosenAddress.phone
          },
          theme: {
            color: '#45563D'
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setError(resp.error?.description || 'Payment transaction failed.');
          setProcessing(false);
        });
        rzp.open();
        return;
      } else {
        // ================= CASH ON DELIVERY =================
        const orderRes = await ordersAPI.createOrder({
          items: itemsPayload,
          shippingAddress: chosenAddress,
          paymentMethod: 'cod'
        });

        if (orderRes.success && orderRes.order) {
          await clearCart();
          navigate(`/order-success/${orderRes.order.orderNumber || orderRes.order._id}`);
        } else {
          throw new Error(orderRes.message || 'Failed to place COD order.');
        }
      }
    } catch (err) {
      setError(err.message || 'Order processing encountered an error. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-28 sm:pt-32 pb-24">
      <SEO
        title="Secure Checkout | Pottery Rugs & Home Decor"
        description="Complete your handcrafted heirloom acquisition with insured white-glove shipping and verified checkout."
        path="/checkout"
      />

      <div className="max-w-6xl mx-auto px-6 md:px-12">
        {/* Navigation */}
        <div className="flex items-center gap-2.5 text-xs uppercase tracking-widest text-[#55694A] font-sans font-bold mb-8">
          <Link to="/collections" className="hover:text-[#362B21] transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Continue Browsing
          </Link>
          <span className="text-[#DACDB3]">/</span>
          <span className="text-[#362B21]">Atelier Checkout</span>
        </div>

        <div className="pb-8 border-b border-[#DACDB3] mb-10">
          <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold block">
            ATELIER ACQUISITION PROCESS
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#362B21] font-light mt-1">
            White-Glove Checkout
          </h1>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-red-900/10 border border-red-800/30 text-red-900 text-xs leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Form & Payment (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Step 1: Delivery Residence */}
            <div className="bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#DACDB3]/70 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#55694A] text-[#FAF7F0] flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h2 className="font-serif text-2xl text-[#362B21] font-medium">Delivery Residence</h2>
                </div>

                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseNewAddress(!useNewAddress)}
                    className="text-xs font-bold text-[#55694A] hover:underline"
                  >
                    {useNewAddress ? 'Select Saved Residence' : '+ Enter New Address'}
                  </button>
                )}
              </div>

              {/* Saved Address Selection */}
              {!useNewAddress && savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs uppercase tracking-wider text-[#4E3C2B] font-bold block">
                    Choose from saved addresses:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr, idx) => (
                      <div
                        key={addr._id || idx}
                        onClick={() => setSelectedAddressIndex(idx)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          selectedAddressIndex === idx
                            ? 'bg-[#FAF7F0] border-[#55694A] shadow-md'
                            : 'bg-[#FAF7F0]/60 border-[#DACDB3] hover:border-[#55694A]/60'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-xs text-[#362B21]">{addr.fullName}</span>
                          {selectedAddressIndex === idx && (
                            <Check className="w-4 h-4 text-[#55694A]" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#4E3C2B] line-clamp-2">{addr.addressLine1}, {addr.city} - {addr.postalCode}</p>
                        <p className="text-[11px] font-mono text-[#55694A] mt-1">{addr.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Address Inputs */}
              {(useNewAddress || savedAddresses.length === 0) && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase tracking-wider font-bold mb-1">Full Recipient Name</label>
                      <input
                        type="text"
                        required
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="e.g. Devendra Singhania"
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
                        placeholder="+91 9839116625"
                        className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider font-bold mb-1">Address Line 1</label>
                    <input
                      type="text"
                      required
                      placeholder="Villa / Flat / Street address"
                      value={addressForm.addressLine1}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                      className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl py-2.5 px-3 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider font-bold mb-1">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      placeholder="Floor, building, estate name"
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
                      <label className="block uppercase tracking-wider font-bold mb-1">Postal Code</label>
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
                        placeholder="Nearby landmark"
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
                </div>
              )}
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-[#DACDB3]/70 pb-4">
                <div className="w-8 h-8 rounded-full bg-[#55694A] text-[#FAF7F0] flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h2 className="font-serif text-2xl text-[#362B21] font-medium">Payment Protocol</h2>
              </div>

              <div className="space-y-3">
                {/* Online Payment Option */}
                <label
                  onClick={() => setPaymentMethod('online')}
                  className={`p-5 rounded-2xl border cursor-pointer flex items-start justify-between transition-all ${
                    paymentMethod === 'online'
                      ? 'bg-[#FAF7F0] border-[#55694A] shadow-md'
                      : 'bg-[#FAF7F0]/60 border-[#DACDB3]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-[#55694A] mt-0.5" />
                    <div>
                      <p className="font-serif text-base font-medium text-[#362B21]">
                        Online Payment (UPI, Cards, NetBanking)
                      </p>
                      <p className="text-xs text-[#4E3C2B] mt-0.5">
                        Secure instant payment gateway with encrypted verification.
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="mt-1 text-[#55694A] focus:ring-0"
                  />
                </label>

                {/* Cash on Delivery Option */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-5 rounded-2xl border cursor-pointer flex items-start justify-between transition-all ${
                    paymentMethod === 'cod'
                      ? 'bg-[#FAF7F0] border-[#55694A] shadow-md'
                      : 'bg-[#FAF7F0]/60 border-[#DACDB3]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Banknote className="w-5 h-5 text-[#55694A] mt-0.5" />
                    <div>
                      <p className="font-serif text-base font-medium text-[#362B21]">
                        Cash on Delivery (COD)
                      </p>
                      <p className="text-xs text-[#4E3C2B] mt-0.5">
                        Inspect piece upon arrival. Payment collected at your residence.
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-[#55694A] focus:ring-0"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#55694A] pt-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Risk: Authentic provenance and return inspection guarantee.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Placement (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <div className="bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] p-8 space-y-6 shadow-sm">
              <h3 className="font-serif text-2xl text-[#362B21] font-light">Acquisition Summary</h3>

              {/* Items List */}
              <div className="divide-y divide-[#DACDB3]/60 max-h-72 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.slug || item.id} className="py-3 flex gap-3 first:pt-0">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#3C4A34] flex-shrink-0 border border-[#DACDB3]">
                      <img
                        src={item.thumbnail || (item.images && item.images[0]) || item.texture || item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-serif text-sm text-[#362B21] font-medium truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-[#4E3C2B]">Qty: {item.quantity || 1}</p>
                      <p className="text-xs font-bold font-sans text-[#55694A]">
                        ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Ledger */}
              <div className="pt-4 border-t border-[#DACDB3] space-y-2 text-xs">
                <div className="flex justify-between text-[#4E3C2B]">
                  <span>Atelier Subtotal</span>
                  <span className="font-bold text-[#362B21]">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#55694A]">
                  <span>Insured White-Glove Shipping</span>
                  <span className="uppercase font-bold tracking-wider">Complimentary</span>
                </div>
                <div className="flex justify-between text-[#4E3C2B]">
                  <span>Customs & Duties</span>
                  <span className="uppercase font-bold tracking-wider">Included</span>
                </div>

                <div className="pt-3 border-t border-[#DACDB3] flex justify-between text-lg font-bold text-[#362B21]">
                  <span className="font-serif">Grand Total</span>
                  <span className="font-sans text-2xl">₹{subtotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold py-4 px-6 rounded-full text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <span>{processing ? 'Confirming Acquisition...' : paymentMethod === 'online' ? 'Proceed to Online Payment' : 'Confirm Order (COD)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <span className="text-[10px] text-[#4E3C2B]/70 block">
                  Encrypted 256-Bit SSL Atelier Checkout
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
