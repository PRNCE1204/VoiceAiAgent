import axios from 'axios';
import React, { useState } from 'react'
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ServerUrl } from '../App';
import { 
  FiCheck, FiLayers, FiShield, FiTrendingUp, FiLock, 
  FiHelpCircle, FiChevronDown, FiChevronUp, FiCreditCard,
  FiActivity, FiCpu
} from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi';

function Billing({ user, setUser, darkMode }) {
  const navigate = useNavigate()
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const [expandedFaq, setExpandedFaq] = useState(null);
  
  // Mock Razorpay Modal Simulation States
  const [showMockRazorpay, setShowMockRazorpay] = useState(false);
  const [mockOrder, setMockOrder] = useState(null);

  const remainingMessages = Math.max(0, (user?.requestLimit || 0) - (user?.totalMessages || 0));
  const remainingDays = user?.proExpiresAt
    ? Math.max(0, Math.ceil((new Date(user.proExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Usage Percentage for visual gauge
  const usedMessages = user?.totalMessages || 0;
  const maxMessages = user?.requestLimit || 200;
  const usagePercentage = Math.min(100, Math.round((usedMessages / maxMessages) * 100));

  const handleSimulateSuccess = async () => {
    setShowMockRazorpay(false);
    const toastId = toast.loading("Processing simulated transaction...");
    try {
      const verifyRes = await axios.post(ServerUrl + "/api/billing/verify", {
        razorpay_order_id: mockOrder.id,
        razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 10)}`,
        razorpay_signature: "mock_success_signature",
        isBypass: true
      }, { withCredentials: true });
      
      if (verifyRes.data.success) {
        toast.success("Payment simulation successful! Account upgraded.", { id: toastId });
        setUser(verifyRes.data.user);
      } else {
        toast.error("Simulation verification failed: " + verifyRes.data.message, { id: toastId });
      }
    } catch (err) {
      toast.error("Payment simulation verification failed", { id: toastId });
      console.error(err);
    }
  };

  const handleSimulateFailure = () => {
    setShowMockRazorpay(false);
    toast.error("Payment simulated failure / cancelled");
  };

  const handlePay = async () => {
    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

      // Calculate order plan based on chosen billing period
      const planType = billingPeriod === 'yearly' ? 'pro_yearly' : 'pro';
      const res = await axios.post(ServerUrl + "/api/billing/order", { plan: "pro" }, { withCredentials: true })
      const order = res.data.order

      // If Razorpay keys are not configured or are placeholder values, trigger the mock modal UI
      if (!razorpayKey || razorpayKey.includes("add your") || razorpayKey === "") {
        setMockOrder(order);
        setShowMockRazorpay(true);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "VoxaAI",
        description: `${billingPeriod === 'yearly' ? 'Yearly' : '3-Month'} Pro Subscription`,
        order_id: order.id,
        handler: async (response) => {
          const verifyRes = await axios.post(ServerUrl + "/api/billing/verify", response, { withCredentials: true })
          if (verifyRes.data.success) {
            toast.success("Payment successful!");
            setUser(verifyRes.data.user);
          }
        },
        theme: {
          color: "#a855f7",
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      toast.error("Payment initialization failed");
      console.log(error);
    }
  }

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const bgClass = darkMode ? 'bg-[#070913] text-slate-100' : 'bg-slate-50 text-slate-800';
  const cardClass = darkMode ? 'bg-[#0c0f22]/90 border border-purple-500/10 backdrop-blur-md relative' : 'bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative';
  const titleClass = darkMode ? 'text-white font-mono' : 'text-slate-900';
  const subtextClass = darkMode ? 'text-slate-500' : 'text-slate-400';

  const FAQ_ITEMS = [
    { q: "How do message response credits work?", a: "Each time your voice assistant responds to a visitor's question, it consumes 1 credit. The free tier includes 200 response credits. Under the Pro tier, you get unlimited credits." },
    { q: "Can I cancel my subscription at any time?", a: "Yes, you can cancel your subscription from your dashboard anytime. Your Pro status will remain active until the end of your currently paid billing period." },
    { q: "Is payment processing secure?", a: "Absolutely. All transactions are securely routed and processed through Razorpay using end-to-end AES-256 banking encryption protocol." }
  ];

  return (
    <div className={`min-h-screen transition-all ${bgClass} px-4 py-10 relative`}>
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        {darkMode ? (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-600/8 to-indigo-600/5 blur-[140px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-emerald-500/6 to-cyan-500/6 blur-[120px]" />
            <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
          </>
        ) : (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-400/5 to-indigo-400/5 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-emerald-400/5 to-cyan-400/5 blur-[100px]" />
          </>
        )}
      </div>

      <div className='relative z-10 max-w-5xl mx-auto'>

        {/* Heading */}
        <div className='mb-8 text-left'>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 ${darkMode ? 'border-purple-500/20 bg-purple-500/5 text-purple-400' : 'border-purple-100 bg-purple-50 text-purple-600'}`}>
            <FiCpu className="animate-spin text-purple-500" /> ACCOUNT_BILLING_INTERFACE
          </div>
          <h2 className={`text-4xl font-black tracking-tight ${titleClass}`}>
            BILLING & <span className='text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-emerald-400 font-sans'>SUBSCRIPTION</span>
          </h2>
          <p className={`${subtextClass} mt-2 text-xs font-mono`}>DEVICE_NODE: SUBSCRIPTION_MODULE // PAYMENT_GATEWAY: RAZORPAY_SECURE</p>
        </div>

        {/* Diagnostic Telemetry Ribbon (Only Dark Mode) */}
        {darkMode && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 bg-[#0c0f22]/50 border border-purple-500/10 rounded-xl p-3 text-[10px] font-mono text-slate-500">
            <div><span className="text-purple-400">// PROTOCOL:</span> SECURE_SSL</div>
            <div><span className="text-purple-400">// ENCRYPTION:</span> AES_256</div>
            <div><span className="text-purple-400">// GATEWAY:</span> RAZORPAY_API</div>
            <div><span className="text-purple-400">// COMPLIANCE:</span> PCI_DSS_L1</div>
          </div>
        )}

        {/* Usage Analytics and Status Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch'>
          
          {/* Circular/Visual Credit usage dial */}
          <div 
            style={darkMode ? { clipPath: "polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px)" } : { borderRadius: "16px" }}
            className={`p-6 border flex flex-col items-center justify-center text-center md:col-span-1 ${cardClass}`}
          >
            {darkMode && (
              <>
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-purple-500/30" />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-purple-500/30" />
                <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-purple-500/30" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-purple-500/30" />
                <div className="absolute top-2 right-3 text-[7px] font-mono text-purple-400/40 uppercase tracking-wider">USAGE_METER</div>
              </>
            )}

            {/* Circular Progress Gauge */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="46" stroke={darkMode ? "rgba(255,255,255,0.03)" : "#e2e8f0"} strokeWidth="8" fill="transparent" />
                <circle cx="56" cy="56" r="46" stroke="url(#meterGrad)" strokeWidth="8" fill="transparent"
                  strokeDasharray="289" strokeDashoffset={289 - (289 * usagePercentage) / 100} strokeLinecap="round" />
                <defs>
                  <linearGradient id="meterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-lg font-black ${titleClass}`}>{usagePercentage}%</span>
                <span className="text-[8px] text-slate-500 font-mono">CONSUMED</span>
              </div>
            </div>

            <p className="text-xs font-mono text-slate-400 mt-2">
              {usedMessages} / {maxMessages} CREDITS USED
            </p>
          </div>

          {/* Subscription stats details */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div 
              style={darkMode ? { clipPath: "polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px)" } : { borderRadius: "16px" }}
              className={`p-6 border flex flex-col justify-between text-left ${cardClass}`}
            >
              {darkMode && <div className="absolute top-2 right-3 text-[7px] font-mono text-purple-400/40 uppercase tracking-wider">TIER_ID</div>}
              <div>
                <p className={`text-[9px] uppercase font-mono tracking-wider ${subtextClass} mb-1`}>Active Plan</p>
                <h2 className={`text-2xl font-black capitalize ${titleClass}`}>{user?.plan}</h2>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-4">// SYS_STATUS: OPERATIONAL</p>
            </div>

            <div 
              style={darkMode ? { clipPath: "polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px)" } : { borderRadius: "16px" }}
              className={`p-6 border flex flex-col justify-between text-left ${cardClass}`}
            >
              {darkMode && <div className="absolute top-2 right-3 text-[7px] font-mono text-purple-400/40 uppercase tracking-wider">VAL_STATUS</div>}
              <div>
                <p className={`text-[9px] uppercase font-mono tracking-wider ${subtextClass} mb-1`}>Gemini API Gateway</p>
                <h2 className={`text-2xl font-black capitalize ${user?.geminiStatus === "active" ? "text-emerald-400" : "text-red-400"}`}>
                  {user?.geminiStatus}
                </h2>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-4">// CONN: VERIFIED</p>
            </div>

            <div 
              style={darkMode ? { clipPath: "polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px)" } : { borderRadius: "16px" }}
              className={`p-6 border flex flex-col justify-between text-left sm:col-span-2 ${cardClass}`}
            >
              {darkMode && <div className="absolute top-2 right-3 text-[7px] font-mono text-purple-400/40 uppercase tracking-wider">VAL_EXP</div>}
              <div>
                <p className={`text-[9px] uppercase font-mono tracking-wider ${subtextClass} mb-1`}>
                  {user?.plan === "free" ? "Credits Reset Window" : "Subscription Expiration"}
                </p>
                <h2 className={`text-2xl font-black ${titleClass}`}>
                  {user?.plan === "free" ? remainingMessages + " messages remaining" : `${remainingDays} Days Remaining`}
                </h2>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-4">// CYCLE_RESET: MONTHLY</p>
            </div>
          </div>
        </div>

        {/* Monthly vs Yearly Billing Switch Toggle */}
        <div className="flex items-center justify-center gap-3 mt-10">
          <span className={`text-xs font-mono ${billingPeriod === 'monthly' ? 'text-purple-400 font-bold' : 'text-slate-500'}`}>Monthly Billing</span>
          <button 
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className={`w-12 h-6 rounded-full p-0.5 relative flex items-center transition-all cursor-pointer border-none ${darkMode ? 'bg-purple-950/60 border border-purple-500/20' : 'bg-slate-200 border border-slate-300'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-purple-500 transition-all duration-300 ${billingPeriod === 'yearly' ? 'translate-x-6 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'translate-x-0.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]'}`} />
          </button>
          <span className={`text-xs font-mono flex items-center gap-1.5 ${billingPeriod === 'yearly' ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            Yearly Billing
            <span className="px-2 py-0.5 rounded-full text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">Save 20%</span>
          </span>
        </div>

        {/* Plan Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-stretch'>
          
          {/* Free Plan */}
          <div 
            style={darkMode ? { clipPath: "polygon(16px 0%, calc(100% - 16px) 0%, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0% calc(100% - 16px), 0% 16px)" } : { borderRadius: "16px" }}
            className={`p-8 border flex flex-col justify-between ${cardClass}`}
          >
            {darkMode && (
              <>
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-purple-500/30" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-500/30" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-500/30" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-purple-500/30" />
                <div className="absolute top-2 right-4 text-[7px] font-mono text-purple-400/40 uppercase tracking-widest">CFG_PLAN_FREE</div>
              </>
            )}
            
            <div className="text-left">
              <h2 className={`text-2xl font-black font-mono ${titleClass}`}>FREE_TIER</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className={`text-5xl font-black ${titleClass}`}>₹0</span>
                <span className={`${subtextClass} font-mono text-xs`}>/month</span>
              </div>
              <ul className={`mt-6 space-y-4 text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <li className="flex items-center gap-2.5"><FiCheck className="text-emerald-500" /> 200 responses per month</li>
                <li className="flex items-center gap-2.5"><FiCheck className="text-emerald-500" /> Basic voice widget theme</li>
                <li className="flex items-center gap-2.5"><FiCheck className="text-emerald-500" /> Standard vector ingestion</li>
                <li className="flex items-center gap-2.5"><FiCheck className="text-emerald-500" /> Real-time console sync</li>
              </ul>
            </div>
            
            <button disabled className={`mt-8 h-12 w-full rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-solid font-mono ${darkMode ? 'bg-white/[0.04] border-white/10 text-slate-500 cursor-not-allowed' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}>
              CURRENT_ACTIVE_NODE
            </button>
          </div>

          {/* Pro Plan */}
          <div className='rounded-2xl p-[1.5px] bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500 flex flex-col justify-between shadow-lg relative overflow-hidden text-left'>
            <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className={`rounded-2xl p-8 flex flex-col justify-between h-full bg-[#0c0f22]/95 text-white relative`}>
              
              {darkMode && (
                <>
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-purple-500/40" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-500/40" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-500/40" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-purple-500/40" />
                  <div className="absolute top-2 right-4 text-[7px] font-mono text-purple-400/40 uppercase tracking-widest">CFG_PLAN_PRO</div>
                </>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white font-mono">PRO_TIER</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[8px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">MAX_ACCORD</span>
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">
                    {billingPeriod === 'yearly' ? '₹5590' : '₹699'}
                  </span>
                  <span className="text-slate-400 font-mono text-xs">
                    {billingPeriod === 'yearly' ? '/year' : '/3-months'}
                  </span>
                </div>
                {billingPeriod === 'yearly' && <p className="text-[10px] text-emerald-400 font-bold font-mono mt-1">// SAVE ₹1,200 WITH ANNUAL CONDUIT MODE</p>}
                
                <ul className='mt-6 space-y-4 text-xs font-mono text-slate-300'>
                  <li className="flex items-center gap-2.5"><FiCheck className="text-emerald-400" /> Unlimited voice conversations</li>
                  <li className="flex items-center gap-2.5"><FiCheck className="text-emerald-400" /> Female & Male vocalist modules</li>
                  <li className="flex items-center gap-2.5"><FiCheck className="text-emerald-400" /> Custom script placement alignment</li>
                  <li className="flex items-center gap-2.5"><FiCheck className="text-emerald-400" /> Dedicated RAG pipeline caching</li>
                  <li className="flex items-center gap-2.5"><FiCheck className="text-emerald-400" /> Priority API request indexing</li>
                </ul>
              </div>

              <button
                onClick={handlePay}
                disabled={user?.plan === "pro"}
                style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                className={`mt-8 h-12 w-full font-bold text-xs uppercase tracking-wider transition-all border-none font-mono ${user?.plan === "pro" ? 'bg-emerald-500/20 text-emerald-400 cursor-default' : 'bg-white text-slate-900 hover:bg-slate-100 cursor-pointer'}`}
              >
                {user?.plan === "pro" ? "ACTIVE_PLAN" : "COMMIT_SUBSCRIPTION_UPGRADE"}
              </button>
            </div>
          </div>
        </div>

        {/* Accordion FAQ Section */}
        <div className="mt-16 text-left max-w-3xl mx-auto">
          <h3 className={`text-xl font-bold mb-6 font-mono text-center ${titleClass}`}>
            // SUBSCRIPTION_FAQ
          </h3>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => (
              <div 
                key={idx}
                className={`border rounded-xl transition-all ${darkMode ? 'border-purple-500/10 bg-white/[0.01]' : 'border-slate-200 bg-white'}`}
              >
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left font-mono font-bold text-xs hover:opacity-80 cursor-pointer border-none bg-transparent"
                  style={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}
                >
                  <span className="flex items-center gap-2">
                    <FiHelpCircle className="text-purple-400 shrink-0" />
                    {item.q}
                  </span>
                  {expandedFaq === idx ? <FiChevronUp className="text-purple-400" /> : <FiChevronDown className="text-purple-400" />}
                </button>
                {expandedFaq === idx && (
                  <div className="px-5 pb-4 pt-1 text-[11px] font-mono leading-relaxed text-slate-500 border-t border-slate-100/10">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Mock Razorpay Modal Overlay */}
      {showMockRazorpay && mockOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
          <div className="bg-[#1b1e2e] border border-purple-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(168,85,247,0.2)]">
            
            {/* Razorpay Brand Header */}
            <div className="bg-[#111422] p-5 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                  VoxaAI
                </h3>
                <p className="text-xs text-slate-400 mt-1">{billingPeriod === 'yearly' ? 'Yearly' : '3-Month'} Pro Subscription</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono text-purple-400 font-bold">₹{(mockOrder.amount / 100).toFixed(2)}</p>
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-mono font-semibold">TEST MODE</span>
              </div>
            </div>

            {/* Sandbox Simulation Notice */}
            <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-3 text-xs text-yellow-400 text-center flex items-center justify-center gap-2">
              <span className="text-sm">⚠️</span>
              <span><strong>Razorpay Standard Checkout Simulator</strong></span>
            </div>

            {/* Simulated Payment Methods */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400 font-mono tracking-wider uppercase mb-2">Simulate Payment Method</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleSimulateSuccess()} 
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/5 bg-[#141727] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-white text-xs border-none cursor-pointer"
                >
                  <span className="text-lg">💳</span>
                  Card / Netbanking
                </button>
                <button 
                  onClick={() => handleSimulateSuccess()} 
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/5 bg-[#141727] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-white text-xs border-none cursor-pointer"
                >
                  <span className="text-lg">📱</span>
                  UPI / Wallet
                </button>
              </div>

              {/* simulated actions */}
              <div className="pt-4 border-t border-white/5 flex gap-3">
                <button 
                  onClick={() => handleSimulateSuccess()} 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-[0_4px_15px_rgba(168,85,247,0.3)] text-xs flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  <span>✓</span> Simulate Success Payment
                </button>
                
                <button 
                  onClick={() => handleSimulateFailure()} 
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-semibold py-3 px-4 rounded-xl transition-all text-xs border-none cursor-pointer animate-pulse"
                >
                  Simulate Fail
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#111422] p-4 text-center border-t border-white/5">
              <button 
                onClick={() => handleSimulateFailure()} 
                className="text-[10px] text-slate-500 hover:text-slate-300 font-mono tracking-wider uppercase bg-transparent border-none cursor-pointer"
              >
                [ Cancel & Close Checkout ]
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default Billing
