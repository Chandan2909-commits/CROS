import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import confetti from 'canvas-confetti';
import {
  Banknote,
  QrCode,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  X,
  CreditCard
} from 'lucide-react';

export function CheckoutModal() {
  const {
    cartTotals,
    processCheckout,
    activeModal,
    setActiveModal,
    storeConfig
  } = usePOS();

  if (activeModal !== 'checkout') return null;

  const totalDue = cartTotals.grandTotal;

  // Active Tab: 'CASH' | 'UPI' | 'SPLIT'
  const [paymentMode, setPaymentMode] = useState('CASH');

  // Cash State
  const [cashReceived, setCashReceived] = useState(totalDue);
  const changeToReturn = Math.max(0, cashReceived - totalDue);
  const isCashInsufficient = cashReceived < totalDue;

  // UPI State
  const [upiState, setUpiState] = useState('PENDING'); // 'PENDING' | 'VERIFYING' | 'SUCCESS' | 'FAILED'
  const [upiCountdown, setUpiCountdown] = useState(120);
  const [mockUpiTxn, setMockUpiTxn] = useState(`UPI/${Date.now().toString().slice(-8)}`);

  // Split State
  const [splitCash, setSplitCash] = useState(Math.round(totalDue / 2));
  const [splitUpi, setSplitUpi] = useState(totalDue - Math.round(totalDue / 2));

  // Additional Notes
  const [notes, setNotes] = useState('');

  // Auto-update default cash when total changes
  useEffect(() => {
    setCashReceived(totalDue);
    setSplitCash(Math.round(totalDue / 2));
    setSplitUpi(totalDue - Math.round(totalDue / 2));
  }, [totalDue]);

  // UPI Countdown timer
  useEffect(() => {
    let timer;
    if (paymentMode === 'UPI' && upiState === 'PENDING' && upiCountdown > 0) {
      timer = setInterval(() => setUpiCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [paymentMode, upiState, upiCountdown]);

  // Handle Complete Sale
  const handleComplete = (methodOverride) => {
    const method = methodOverride || paymentMode;

    const result = processCheckout({
      method,
      cashReceived: Number(cashReceived),
      splitCash: Number(splitCash),
      splitUpi: Number(splitUpi),
      upiRef: mockUpiTxn,
      notes
    });

    if (result) {
      // Confetti burst for triumphant checkout experience!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // Simulate instant customer scan & webhook confirmation
  const handleSimulateUpiPayment = () => {
    setUpiState('VERIFYING');
    setTimeout(() => {
      setUpiState('SUCCESS');
      setTimeout(() => {
        handleComplete('UPI');
      }, 700);
    }, 1200);
  };

  // Preset denomination helpers for Cash
  const addCashDenom = (amount) => {
    setCashReceived(prev => Number(prev || 0) + amount);
  };

  const setExactCash = (amount) => {
    setCashReceived(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="animate-spring-modal bg-white w-full max-w-xl rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1e1e1e] text-white flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                Collect Payment & Finalize
              </h2>
              <span className="text-[11px] font-semibold text-slate-400">
                Total Payable: <strong className="text-slate-900 font-mono">₹{totalDue.toLocaleString('en-IN')}</strong>
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-100 mx-4 mt-4 rounded-2xl">
          <button
            onClick={() => setPaymentMode('CASH')}
            className={`btn-press flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              paymentMode === 'CASH'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span>Cash Tender</span>
          </button>

          <button
            onClick={() => setPaymentMode('UPI')}
            className={`btn-press flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              paymentMode === 'UPI'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>UPI Instant QR</span>
          </button>

          <button
            onClick={() => setPaymentMode('SPLIT')}
            className={`btn-press flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              paymentMode === 'SPLIT'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Split Payment</span>
          </button>
        </div>

        {/* Tab 1: CASH PAYMENT (The canonical brain.md requirement) */}
        {paymentMode === 'CASH' && (
          <div className="p-5 flex flex-col gap-4">
            {/* Amount Due Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                  Amount Due
                </span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                  ₹{totalDue.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Cash Received Input */}
              <div className="p-3.5 rounded-2xl bg-white border-2 border-[#1e1e1e] focus-within:ring-2 focus-within:ring-[#1e1e1e]/20 transition-all">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block">
                  Cash Received (Tender)
                </span>
                <div className="flex items-center text-2xl font-extrabold text-slate-900 font-mono">
                  <span className="text-slate-400 mr-1">₹</span>
                  <input
                    type="number"
                    autoFocus
                    min={0}
                    value={cashReceived}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="w-full bg-transparent outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Quick Denomination Chips */}
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Quick Denomination Preset
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                <button
                  type="button"
                  onClick={() => setExactCash(totalDue)}
                  className="btn-press py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-mono"
                >
                  Exact (₹{totalDue})
                </button>
                <button
                  type="button"
                  onClick={() => setExactCash(500)}
                  className="btn-press py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-mono"
                >
                  ₹500
                </button>
                <button
                  type="button"
                  onClick={() => setExactCash(1000)}
                  className="btn-press py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-mono"
                >
                  ₹1,000
                </button>
                <button
                  type="button"
                  onClick={() => setExactCash(2000)}
                  className="btn-press py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-mono"
                >
                  ₹2,000
                </button>
                <button
                  type="button"
                  onClick={() => addCashDenom(100)}
                  className="btn-press py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold font-mono"
                >
                  +₹100
                </button>
                <button
                  type="button"
                  onClick={() => addCashDenom(500)}
                  className="btn-press py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold font-mono"
                >
                  +₹500
                </button>
              </div>
            </div>

            {/* Change to Return Banner (Core Feature of PRD) */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isCashInsufficient
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200/90 text-emerald-950 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider block">
                    {isCashInsufficient ? 'Insufficient Cash Tendered' : 'Change To Return To Customer'}
                  </span>
                  <span className="text-3xl font-extrabold font-mono tracking-tight block mt-0.5">
                    {isCashInsufficient
                      ? `Short by ₹${(totalDue - cashReceived).toLocaleString('en-IN')}`
                      : `₹${changeToReturn.toLocaleString('en-IN')}`}
                  </span>
                </div>

                {!isCashInsufficient && (
                  <div className="text-right text-xs font-medium text-emerald-800 bg-white/70 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <div>Net Cash in Drawer:</div>
                    <div className="font-bold font-mono text-slate-900">
                      +₹{cashReceived} - ₹{changeToReturn} = ₹{totalDue}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={() => handleComplete('CASH')}
              disabled={isCashInsufficient}
              className="btn-press w-full py-4 rounded-2xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-sm font-bold shadow-[0_4px_16px_rgba(0,0,0,0.2)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
            >
              <span>Complete Cash Sale</span>
              <span className="font-mono text-emerald-400 font-extrabold">(Return ₹{changeToReturn})</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}

        {/* Tab 2: UPI PAYMENT */}
        {paymentMode === 'UPI' && (
          <div className="p-5 flex flex-col items-center text-center gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col items-center">
              {/* Dynamic QR Code representation */}
              <div className="w-44 h-44 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                {/* SVG QR Code Pattern */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect width="100" height="100" fill="white" />
                  {/* Outer corner finders */}
                  <rect x="5" y="5" width="28" height="28" fill="#1e1e1e" rx="3" />
                  <rect x="9" y="9" width="20" height="20" fill="white" rx="2" />
                  <rect x="13" y="13" width="12" height="12" fill="#1e1e1e" rx="1" />

                  <rect x="67" y="5" width="28" height="28" fill="#1e1e1e" rx="3" />
                  <rect x="71" y="9" width="20" height="20" fill="white" rx="2" />
                  <rect x="75" y="13" width="12" height="12" fill="#1e1e1e" rx="1" />

                  <rect x="5" y="67" width="28" height="28" fill="#1e1e1e" rx="3" />
                  <rect x="9" y="71" width="20" height="20" fill="white" rx="2" />
                  <rect x="13" y="75" width="12" height="12" fill="#1e1e1e" rx="1" />

                  {/* Random QR data matrix modules */}
                  {[
                    [40, 10], [50, 10], [40, 20], [55, 25],
                    [10, 45], [20, 50], [30, 40], [35, 55],
                    [45, 45], [50, 60], [60, 40], [60, 55],
                    [75, 45], [85, 50], [70, 70], [80, 80],
                    [45, 75], [55, 85], [40, 90], [60, 90]
                  ].map(([x, y], i) => (
                    <rect key={i} x={x} y={y} width="6" height="6" fill="#1e1e1e" />
                  ))}
                  {/* Center Brand Badge */}
                  <rect x="40" y="40" width="20" height="20" fill="#1d4ed8" rx="4" />
                  <text x="50" y="54" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">₹</text>
                </svg>

                {upiState === 'VERIFYING' && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center text-blue-700">
                    <RotateCw className="w-8 h-8 animate-spin mb-1 text-blue-600" />
                    <span className="text-[11px] font-bold">Verifying Webhook...</span>
                  </div>
                )}

                {upiState === 'SUCCESS' && (
                  <div className="absolute inset-0 bg-emerald-500 text-white flex flex-col items-center justify-center animate-spring-modal">
                    <CheckCircle2 className="w-10 h-10 mb-1" />
                    <span className="text-xs font-extrabold uppercase">Payment Verified!</span>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <span className="text-xl font-extrabold font-mono text-slate-900">
                  ₹{totalDue.toLocaleString('en-IN')}
                </span>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  VPA: {storeConfig.upiVpa}
                </div>
              </div>
            </div>

            {/* UPI State Machine info */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Awaiting payment... Expires in {upiCountdown}s</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-[11px]">Txn ID: {mockUpiTxn}</span>
            </div>

            {/* Webhook Simulator Action */}
            <button
              onClick={handleSimulateUpiPayment}
              disabled={upiState !== 'PENDING'}
              className="btn-press w-full py-3.5 rounded-2xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold shadow-brand flex items-center justify-center gap-2"
            >
              <span>⚡ Simulate Customer Scanned & Paid</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab 3: SPLIT PAYMENT */}
        {paymentMode === 'SPLIT' && (
          <div className="p-5 flex flex-col gap-4">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs font-semibold text-slate-500">Total Required</span>
              <div className="text-2xl font-extrabold font-mono text-slate-900">
                ₹{totalDue.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Cash Portion
                </span>
                <div className="flex items-center text-xl font-extrabold font-mono text-slate-900">
                  <span className="text-slate-400 mr-1">₹</span>
                  <input
                    type="number"
                    min={0}
                    max={totalDue}
                    value={splitCash}
                    onChange={(e) => {
                      const c = Number(e.target.value);
                      setSplitCash(c);
                      setSplitUpi(Math.max(0, totalDue - c));
                    }}
                    className="w-full bg-transparent outline-none font-mono"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  UPI Portion
                </span>
                <div className="flex items-center text-xl font-extrabold font-mono text-slate-900">
                  <span className="text-slate-400 mr-1">₹</span>
                  <input
                    type="number"
                    min={0}
                    max={totalDue}
                    value={splitUpi}
                    onChange={(e) => {
                      const u = Number(e.target.value);
                      setSplitUpi(u);
                      setSplitCash(Math.max(0, totalDue - u));
                    }}
                    className="w-full bg-transparent outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="text-center text-xs font-semibold text-slate-600 bg-purple-50 p-2.5 rounded-xl border border-purple-200">
              Cash: ₹{splitCash} + UPI: ₹{splitUpi} = ₹{Number(splitCash) + Number(splitUpi)}
            </div>

            <button
              onClick={() => handleComplete('SPLIT')}
              disabled={Number(splitCash) + Number(splitUpi) < totalDue}
              className="btn-press w-full py-4 rounded-2xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-sm font-bold shadow-brand flex items-center justify-center gap-2"
            >
              <span>Complete Split Sale</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
