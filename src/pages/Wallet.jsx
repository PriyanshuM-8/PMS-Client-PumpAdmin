import { useState, useEffect } from 'react';
import api from '../utils/api';
import Swal from 'sweetalert2';
import { MdAccountBalanceWallet, MdAdd } from 'react-icons/md';

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const { data } = await api.get('/wallet');
      setWallet(data.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Could not load wallet details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    if (!addAmount || Number(addAmount) <= 0) return;
    setAdding(true);
    
    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        Swal.fire('Error', 'Razorpay SDK failed to load. Are you online?', 'error');
        setAdding(false);
        return;
      }

      // 1. Create order on backend
      const { data: orderData } = await api.post('/wallet/create-order', { amount: Number(addAmount) });
      const { orderId, amount, currency, keyId } = orderData.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: amount.toString(),
        currency: currency,
        name: "PetroCareX Platform",
        description: "Wallet Recharge",
        order_id: orderId,
        handler: async function (response) {
          try {
            // 3. Verify payment on backend
            const { data: verifyData } = await api.post('/wallet/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(addAmount)
            });

            Swal.fire('Success', verifyData.message, 'success');
            setWallet(prev => ({ ...prev, walletBalance: verifyData.walletBalance }));
            setAddAmount('');
          } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Payment verification failed', 'error');
          }
        },
        prefill: {
          name: "Pump Admin",
          email: "admin@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#F97316"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to initiate payment', 'error');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Wallet</h1>
        <p className="text-gray-500 text-xs mt-1">Manage your platform fee balance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-8 text-white shadow-xl shadow-orange-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-10" />
          
          <MdAccountBalanceWallet className="text-5xl mb-4 opacity-90 relative z-10" />
          <p className="text-white/80 text-xs font-bold uppercase tracking-wider relative z-10">Current Balance</p>
          <h2 className="text-5xl font-black mt-2 relative z-10">₹{wallet?.walletBalance || 0}</h2>

          {wallet?.isTrialActive ? (
            <div className="mt-6 bg-white/20 px-4 py-2 rounded-xl text-xs font-bold relative z-10 backdrop-blur-sm border border-white/30">
              Free Trial Active until {new Date(wallet.freeTrialEndsAt).toLocaleDateString()}
            </div>
          ) : (
            <div className="mt-6 bg-black/20 px-4 py-2 rounded-xl text-xs font-bold relative z-10 backdrop-blur-sm border border-white/10">
              Platform Fee: ₹20 / day on first booking
            </div>
          )}
        </div>

        {/* Add Money Form */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
          <h3 className="font-bold text-gray-800 mb-6 text-sm">Add Money to Wallet</h3>
          <form onSubmit={handleAddMoney} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-bold mb-1.5 block">Amount (₹)</label>
              <input
                type="number"
                min="1"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
              />
            </div>
            <button
              type="submit"
              disabled={adding || !addAmount || Number(addAmount) <= 0}
              className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-black text-sm shadow-md shadow-orange-200/50 disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-orange-600 transition-all"
            >
              {adding ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <><MdAdd className="text-lg" /> Add Money</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
