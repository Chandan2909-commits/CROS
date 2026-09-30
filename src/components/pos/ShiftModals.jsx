import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Clock,
  Banknote,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileText
} from 'lucide-react';

export function ShiftModals() {
  const {
    activeModal,
    setActiveModal,
    currentShift,
    openShift,
    closeShift,
    addCashMovement,
    getDrawerCash,
    currentUser
  } = usePOS();

  // --- Open Shift State ---
  const [openDenoms, setOpenDenoms] = useState({
    500: 6,
    200: 5,
    100: 10,
    50: 0,
    20: 0,
    10: 0
  });

  const totalOpeningCash = Object.entries(openDenoms).reduce(
    (sum, [denom, count]) => sum + Number(denom) * Number(count || 0),
    0
  );

  const handleOpenShiftSubmit = (e) => {
    e.preventDefault();
    openShift({
      openingCash: totalOpeningCash,
      openingDenominations: openDenoms
    });
  };

  // --- Close Shift State ---
  const [closeDenoms, setCloseDenoms] = useState({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0
  });
  const [customActualCash, setCustomActualCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  const countedFromDenoms = Object.entries(closeDenoms).reduce(
    (sum, [denom, count]) => sum + Number(denom) * Number(count || 0),
    0
  );

  const actualCashCounted = customActualCash !== '' ? Number(customActualCash) : countedFromDenoms;

  // Expected Cash calculation based on PRD Section 14 & 36
  const opening = currentShift?.openingCash || 0;
  const cashSales = currentShift?.cashSales || 0;
  const refundsCash = currentShift?.refundsCash || 0;
  const payIns = currentShift?.payIns || 0;
  const payOuts = currentShift?.payOuts || 0;

  const expectedCash = opening + cashSales - refundsCash + payIns - payOuts;
  const difference = actualCashCounted - expectedCash;

  const handleCloseShiftSubmit = (e) => {
    e.preventDefault();
    closeShift({
      actualCashCounted,
      closingDenominations: closeDenoms,
      notes: closingNotes
    });
  };

  // --- Cash Movement State (Pay-In / Pay-Out) ---
  const [movementType, setMovementType] = useState('PAY_IN');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');

  const handleMovementSubmit = (e) => {
    e.preventDefault();
    if (!movementAmount || Number(movementAmount) <= 0) return;
    addCashMovement({
      type: movementType,
      amount: Number(movementAmount),
      reason: movementReason
    });
    setMovementAmount('');
    setMovementReason('');
  };

  if (!activeModal) return null;

  return (
    <>
      {/* 1. OPEN SHIFT MODAL */}
      {activeModal === 'shiftOpen' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="animate-spring-modal bg-white w-full max-w-lg rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1e1e1e] text-white flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                    Open Shift & Count Float
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Cashier: <strong>{currentUser.name}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenShiftSubmit} className="p-5 flex flex-col gap-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Calculated Opening Float:
                </span>
                <span className="text-2xl font-extrabold font-mono text-slate-900">
                  ₹{totalOpeningCash.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Denomination Grid */}
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Count Rupee Denominations in Drawer
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[500, 200, 100, 50, 20, 10].map((d) => (
                    <div key={d} className="p-2.5 bg-white border border-slate-200 rounded-xl">
                      <div className="flex justify-between text-xs font-bold font-mono text-slate-700 mb-1">
                        <span>₹{d}</span>
                        <span className="text-[10px] text-slate-400">
                          ₹{d * (openDenoms[d] || 0)}
                        </span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={openDenoms[d] || 0}
                        onChange={(e) =>
                          setOpenDenoms({ ...openDenoms, [d]: Math.max(0, parseInt(e.target.value) || 0) })
                        }
                        className="w-full text-sm font-bold font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn-press w-full py-4 rounded-2xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-brand flex items-center justify-center gap-2 mt-2"
              >
                <span>Confirm & Open Shift with ₹{totalOpeningCash}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. CLOSE SHIFT & RECONCILIATION MODAL */}
      {activeModal === 'shiftClose' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="animate-spring-modal bg-white w-full max-w-xl rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1e1e1e] text-white flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                    Shift Cash Reconciliation & Close
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Shift #{currentShift?.id} • Cashier: {currentShift?.cashierName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseShiftSubmit} className="p-5 flex flex-col gap-4">
              {/* Expected Cash Audit Trail (Section 14 & 36 of brain.md) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  System Audit Ledger Breakdown
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-600 font-medium">
                  <div className="flex justify-between">
                    <span>Opening Float:</span>
                    <span className="font-mono text-slate-900">₹{opening.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Cash Sales:</span>
                    <span className="font-mono font-bold">+₹{cashSales.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Cash Refunds:</span>
                    <span className="font-mono font-bold">-₹{refundsCash.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-blue-700">
                    <span>Pay-Ins (Float in):</span>
                    <span className="font-mono font-bold">+₹{payIns.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Pay-Outs (Expenses):</span>
                    <span className="font-mono font-bold">-₹{payOuts.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>UPI Sales (Bank):</span>
                    <span className="font-mono">₹{(currentShift?.upiSales || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="pt-2 mt-1 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
                  <span>System Expected Cash in Drawer:</span>
                  <span className="text-lg font-mono">₹{expectedCash.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Actual Cash Count Input */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border-2 border-[#1e1e1e] rounded-2xl">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Physical Cash Counted
                  </span>
                  <div className="flex items-center text-2xl font-extrabold font-mono text-slate-900">
                    <span className="text-slate-400 mr-1">₹</span>
                    <input
                      type="number"
                      value={customActualCash !== '' ? customActualCash : countedFromDenoms || ''}
                      onChange={(e) => setCustomActualCash(e.target.value)}
                      placeholder={String(expectedCash)}
                      className="w-full bg-transparent outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Variance / Difference Pill */}
                <div
                  className={`p-3 rounded-2xl border flex flex-col justify-center ${
                    difference === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : difference < 0
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider block">
                    Cash Variance (Difference)
                  </span>
                  <span className="text-xl font-extrabold font-mono mt-0.5">
                    {difference > 0 ? `+₹${difference.toLocaleString('en-IN')} (Surplus)` :
                     difference < 0 ? `-₹${Math.abs(difference).toLocaleString('en-IN')} (Shortage)` :
                     '₹0 (Perfect Balance)'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Closing Notes / Variance Justification
                </span>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="e.g., Shortage of ₹50 due to minor loose coin variation..."
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <button
                type="submit"
                className="btn-press w-full py-4 rounded-2xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-brand flex items-center justify-center gap-2"
              >
                <span>Finalize & Close Shift</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. CASH MOVEMENT MODAL (PAY-IN / PAY-OUT) */}
      {activeModal === 'cashMovement' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="animate-spring-modal bg-white w-full max-w-md rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1e1e1e] text-white flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                    Cash Drawer Movement
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Current Drawer: <strong className="text-slate-900 font-mono">₹{getDrawerCash().toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMovementSubmit} className="p-5 flex flex-col gap-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMovementType('PAY_IN')}
                  className={`btn-press py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    movementType === 'PAY_IN'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pay-In (Add Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMovementType('PAY_OUT')}
                  className={`btn-press py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    movementType === 'PAY_OUT'
                      ? 'bg-white text-rose-800 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  <span>Pay-Out (Remove Cash)</span>
                </button>
              </div>

              {/* Amount */}
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Amount (₹)
                </span>
                <input
                  type="number"
                  min={1}
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full text-xl font-extrabold font-mono text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              {/* Reason */}
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Reason / Purpose
                </span>
                <input
                  type="text"
                  required
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder={
                    movementType === 'PAY_IN'
                      ? 'e.g. Change float replenished from store safe'
                      : 'e.g. Office tea, refreshments, courier'
                  }
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div className="flex gap-2">
                {currentShift && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('shiftClose')}
                    className="btn-press flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    Close Shift...
                  </button>
                )}

                <button
                  type="submit"
                  className="btn-press flex-1 py-3 rounded-2xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-brand"
                >
                  Record Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
