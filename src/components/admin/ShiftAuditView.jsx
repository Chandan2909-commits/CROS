import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Clock,
  Banknote,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileText,
  RotateCw,
  Lock,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  Repeat,
  X,
  KeyRound,
  Check,
  Eye,
  ChevronDown
} from 'lucide-react';

export function ShiftAuditView() {
  const {
    currentShift,
    shiftsHistory,
    cashMovements,
    getDrawerCash,
    setActiveModal,
    dailyDrawerRecords,
    zeroDailyDrawer,
    exchanges,
    currentUser,
    users
  } = usePOS();

  const drawerCash = getDrawerCash();

  // Active Sub-Tab: 'daily-records' | 'movements' | 'shifts' | 'exchanges'
  const [activeTab, setActiveTab] = useState('daily-records');
  const [selectedMonth, setSelectedMonth] = useState('2026-09');

  // EOD Zero Drawer Modal State
  const [isZeroModalOpen, setIsZeroModalOpen] = useState(false);
  const [ownerPin, setOwnerPin] = useState('');
  const [ownerName, setOwnerName] = useState('Chandan (Organization Owner)');
  const [zeroNotes, setZeroNotes] = useState('Daily cash sweep banked to store vault. Drawer zeroed.');
  const [pinError, setPinError] = useState('');
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);

  // Filter daily records for selected month
  const monthlyRecords = (dailyDrawerRecords || []).filter(r => r.date.startsWith(selectedMonth));

  // Monthly aggregated totals
  const monthlyGross = monthlyRecords.reduce((sum, r) => sum + (r.grossSales || 0), 0);
  const monthlyRefunds = monthlyRecords.reduce((sum, r) => sum + (r.refundsDeducted || 0), 0);
  const monthlyNet = monthlyRecords.reduce((sum, r) => sum + (r.netMoneyMade || 0), 0);
  const monthlySwept = monthlyRecords.reduce((sum, r) => sum + (r.drawerZeroedAmount || 0), 0);
  const monthlyUpi = monthlyRecords.reduce((sum, r) => sum + (r.upiSales || 0), 0);

  const handleExecuteZeroSweep = (e) => {
    e.preventDefault();
    setPinError('');

    if (!ownerPin) {
      setPinError('Owner PIN is required to authorize drawer zeroing.');
      return;
    }

    const success = zeroDailyDrawer({
      ownerPin: ownerPin.trim(),
      ownerName,
      notes: zeroNotes
    });

    if (success) {
      setIsSuccessFeedback(true);
      setTimeout(() => {
        setIsSuccessFeedback(false);
        setIsZeroModalOpen(false);
        setOwnerPin('');
      }, 1200);
    } else {
      setPinError('Invalid Owner PIN! Default owner PIN is 0000 or 9999.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 select-none bg-slate-50/50">
      {/* Current Active Shift Top Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full ${drawerCash > 0 ? 'bg-emerald-500 animate-pulse-glow' : 'bg-slate-400'}`}></span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
              {drawerCash > 0 ? `Active Shift #${currentShift?.id || 'SH-192'}` : 'Drawer Zeroed / Standby'}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading">
            Current Physical Drawer Float: ₹{drawerCash.toLocaleString('en-IN')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Opened by {currentShift?.cashierName || 'Rahul Sharma'} • Day Sales: ₹{((currentShift?.cashSales || 0) + (currentShift?.upiSales || 0)).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveModal('cashMovement')}
            className="btn-press px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            Log Pay-In / Pay-Out
          </button>
          
          <button
            onClick={() => setActiveModal('shiftClose')}
            className="btn-press px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
          >
            Shift Variance Close
          </button>

          {/* CRITICAL FEATURE: End-of-day Drawer Zero Sweep requiring Owner Permission */}
          <button
            onClick={() => {
              setPinError('');
              setIsZeroModalOpen(true);
            }}
            className="btn-press px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all border border-amber-400"
          >
            <Lock className="w-3.5 h-3.5 text-slate-950" />
            <span>End-of-Day Zero Drawer (Owner Auth)</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
        <button
          onClick={() => setActiveTab('daily-records')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'daily-records'
              ? 'bg-[#1e1e1e] text-white shadow-brand'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Daily Drawer Records (Daily Money Made)</span>
        </button>

        <button
          onClick={() => setActiveTab('exchanges')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'exchanges'
              ? 'bg-[#1e1e1e] text-white shadow-brand'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Product Exchanges Ledger ({exchanges?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'bg-[#1e1e1e] text-white shadow-brand'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Banknote className="w-3.5 h-3.5" />
          <span>Cash Drawer Movements</span>
        </button>

        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'shifts'
              ? 'bg-[#1e1e1e] text-white shadow-brand'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Shift History</span>
        </button>
      </div>

      {/* TAB 1: DAILY DRAWER RECORDS & MONTHLY FINANCIAL LEDGER */}
      {activeTab === 'daily-records' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Month Selector & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Monthly Financial Ledger & Daily Money Made
                </h3>
                <p className="text-[11px] text-slate-400">
                  Everyday drawer balance record, refunds deducted on purchase date, and nightly ₹0 sweeps
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="2026-09">September 2026</option>
                <option value="2026-08">August 2026</option>
                <option value="2026-07">July 2026</option>
              </select>
            </div>
          </div>

          {/* Monthly KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Gross Sales
              </span>
              <span className="text-lg font-black text-slate-900 mt-1 font-mono">
                ₹{monthlyGross.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">All Cash + UPI</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-2xs flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500">
                Refunds Deducted
              </span>
              <span className="text-lg font-black text-rose-700 mt-1 font-mono">
                -₹{monthlyRefunds.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-rose-600/70 mt-0.5">Tied to purchase date</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-2xs flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                Net Money Made
              </span>
              <span className="text-xl font-black text-emerald-800 mt-1 font-mono">
                ₹{monthlyNet.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-700 mt-0.5 font-bold">Total Store Earnings</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                Drawer Swept to ₹0
              </span>
              <span className="text-lg font-black text-amber-900 mt-1 font-mono">
                ₹{monthlySwept.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-amber-700 mt-0.5">Safe Deposits (Owner Auth)</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                UPI / Digital
              </span>
              <span className="text-lg font-black text-indigo-900 mt-1 font-mono">
                ₹{monthlyUpi.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-indigo-500 mt-0.5">Direct to Bank VPA</span>
            </div>
          </div>

          {/* Daily Records Ledger Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading">
                  Daily Breakdown & End-of-Day Zero Drawer Status
                </h3>
                <p className="text-[11px] text-slate-400">
                  Each day's recorded money made, historical refund deductions, and owner verified sweeps
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                {monthlyRecords.length} Days Recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 pl-4">Date</th>
                    <th className="py-3">Gross Sales</th>
                    <th className="py-3">Cash / UPI Split</th>
                    <th className="py-3">Refunds Deducted</th>
                    <th className="py-3">Net Money Made</th>
                    <th className="py-3">EOD Swept to ₹0</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 pr-4">Owner Authorization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {monthlyRecords.map((r, i) => {
                    const isClosed = r.status === 'CLOSED';
                    return (
                      <tr key={r.date} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 pl-4 font-mono font-bold text-slate-900">
                          {new Date(r.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>

                        <td className="py-3.5 font-mono font-bold text-slate-900">
                          ₹{r.grossSales?.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 text-[11px] text-slate-600 font-mono">
                          <span className="text-emerald-700">Cash: ₹{r.cashSales?.toLocaleString('en-IN')}</span>
                          <span className="text-slate-300 mx-1">|</span>
                          <span className="text-indigo-700">UPI: ₹{r.upiSales?.toLocaleString('en-IN')}</span>
                        </td>

                        <td className="py-3.5 font-mono">
                          {r.refundsDeducted > 0 ? (
                            <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              -₹{r.refundsDeducted?.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">₹0.00</span>
                          )}
                        </td>

                        <td className="py-3.5 font-mono font-extrabold text-sm text-emerald-800">
                          ₹{r.netMoneyMade?.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 font-mono font-bold text-slate-800">
                          {r.drawerZeroedAmount > 0 ? (
                            <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                              ₹{r.drawerZeroedAmount?.toLocaleString('en-IN')} Swept
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Pending EOD</span>
                          )}
                        </td>

                        <td className="py-3.5">
                          {isClosed ? (
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>Zeroed / Closed</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                              <span>Active / Open</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-1.5">
                            {r.ownerPinVerified ? (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{r.ownerApprovedBy}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setPinError('');
                                  setIsZeroModalOpen(true);
                                }}
                                className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors"
                              >
                                Authorize Sweep →
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT EXCHANGES LEDGER */}
      {activeTab === 'exchanges' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading">
                Product Exchanges & Swap Ledger
              </h3>
              <p className="text-[11px] text-slate-400">
                Log of items returned and replaced, with price difference settlement
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {exchanges?.length || 0} Exchanges Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3 pl-4">Exchange TxHash</th>
                  <th className="py-3">Original TxHash</th>
                  <th className="py-3">Customer</th>
                  <th className="py-3">Returned Items</th>
                  <th className="py-3">Replacement Items</th>
                  <th className="py-3">Difference Settled</th>
                  <th className="py-3 pr-4 text-right">Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(!exchanges || exchanges.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No product exchanges logged yet. Use the "Return / Exchange" button to swap products.
                    </td>
                  </tr>
                ) : (
                  exchanges.map((exc) => (
                    <tr key={exc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-4 font-mono font-bold text-indigo-700">
                        {exc.txHash}
                      </td>
                      <td className="py-3 font-mono text-slate-500">
                        {exc.originalTxHash || exc.originalInvoice}
                      </td>
                      <td className="py-3 font-semibold text-slate-800">
                        {exc.customerName}
                        {exc.customerPhone && <div className="text-[10px] text-slate-400">{exc.customerPhone}</div>}
                      </td>
                      <td className="py-3 text-[11px] text-rose-700">
                        {exc.returnedItems?.map((r, idx) => (
                          <div key={idx}>- {r.name} ({r.quantity}×)</div>
                        ))}
                      </td>
                      <td className="py-3 text-[11px] text-emerald-800">
                        {exc.newItems?.map((n, idx) => (
                          <div key={idx}>+ {n.name} ({n.quantity}×)</div>
                        ))}
                      </td>
                      <td className="py-3 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                          exc.differenceAmount > 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : exc.differenceAmount < 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {exc.differenceAmount > 0
                            ? `Customer Paid: +₹${exc.differenceAmount}`
                            : exc.differenceAmount < 0
                            ? `Refunded: -₹${Math.abs(exc.differenceAmount)}`
                            : 'Even Swap'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-slate-600 text-[11px]">
                        {exc.cashierName}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CASH MOVEMENTS LEDGER */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading">
                Cash Drawer Movement Ledger
              </h3>
              <p className="text-[11px] text-slate-400">
                Real-time audit log of every rupee entering or leaving the physical cash drawer
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {cashMovements.length} Events Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pl-4">Timestamp</th>
                  <th className="py-2.5">Movement Type</th>
                  <th className="py-2.5">Amount (₹)</th>
                  <th className="py-2.5">Reference / Invoice</th>
                  <th className="py-2.5">Reason / Description</th>
                  <th className="py-2.5 pr-4 text-right">Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {cashMovements.map((cm) => {
                  const isPositive = ['OPENING_BALANCE', 'PAY_IN', 'SALE'].includes(cm.type);
                  return (
                    <tr key={cm.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 pl-4 font-mono text-[11px] text-slate-500">
                        {new Date(cm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          cm.type === 'SALE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : cm.type === 'REFUND'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : cm.type === 'PAY_IN'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : cm.type === 'PAY_OUT'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : cm.type === 'EOD_DRAWER_ZERO_SWEEP'
                            ? 'bg-purple-50 text-purple-700 border-purple-200 font-black'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {cm.type}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono font-bold text-slate-900">
                        <span className={isPositive ? 'text-emerald-700' : 'text-rose-600'}>
                          {isPositive ? '+' : '-'}₹{cm.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-500 text-[11px]">
                        {cm.referenceId || '—'}
                      </td>
                      <td className="py-2.5 text-slate-700 text-[11px]">
                        {cm.reason}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-slate-500 text-[11px]">
                        {cm.user}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SHIFT CLOSING HISTORY */}
      {activeTab === 'shifts' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading">
              Shift Closing Logs & Variance Reconciliation
            </h3>
            <p className="text-[11px] text-slate-400">
              Historical comparisons between system calculated expected cash vs physical drawer count
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 pl-4">Shift ID</th>
                  <th className="py-3">Cashier</th>
                  <th className="py-3">Period</th>
                  <th className="py-3 text-right">Expected Cash</th>
                  <th className="py-3 text-right">Counted Cash</th>
                  <th className="py-3 text-right">Variance</th>
                  <th className="py-3 pr-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {shiftsHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-4 font-mono font-bold text-slate-900">
                      {s.id}
                    </td>
                    <td className="py-3 text-slate-800">
                      {s.cashierName}
                    </td>
                    <td className="py-3 text-slate-500 text-[11px]">
                      {new Date(s.openedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • Closed
                    </td>
                    <td className="py-3 text-right font-mono font-semibold text-slate-800">
                      ₹{s.expectedCash?.toLocaleString('en-IN') || '—'}
                    </td>
                    <td className="py-3 text-right font-mono font-extrabold text-slate-900">
                      ₹{s.actualCash?.toLocaleString('en-IN') || '—'}
                    </td>
                    <td className="py-3 text-right font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                        (s.difference || 0) === 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : (s.difference || 0) < 0
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {(s.difference || 0) >= 0 ? '+' : ''}₹{s.difference || 0}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* OWNER PERMISSION MODAL: END-OF-DAY ZERO DRAWER SWEEP      */}
      {/* ========================================================= */}
      {isZeroModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="animate-spring-modal bg-white w-full max-w-lg rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-500 text-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-sm">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight font-heading">
                    Owner Authorization Required
                  </h3>
                  <p className="text-[11px] text-slate-900/80 font-medium">
                    End-of-Day Drawer Zero Sweep & Financial Lock
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsZeroModalOpen(false)}
                className="p-1 rounded-xl hover:bg-black/10 text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleExecuteZeroSweep} className="p-6 flex flex-col gap-4">
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-900 font-bold uppercase tracking-wider text-[10px]">
                    Current Drawer Cash To Be Swept to ₹0.00:
                  </span>
                  <span className="font-mono text-xl font-extrabold text-amber-950">
                    ₹{drawerCash.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Per security rules, sweeping today's drawer balance to ₹0.00 closes the day's record and locks the daily ledger. This action <strong>always requires verified permission from the Owner</strong>.
                </p>
              </div>

              {/* Owner Selector */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">
                  Authorizing Owner / Executive:
                </label>
                <select
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Chandan (Organization Owner)">Chandan (Organization Owner)</option>
                  <option value="Anita Verma (Store Manager)">Anita Verma (Store Manager)</option>
                </select>
              </div>

              {/* Owner PIN Verification */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">
                  Owner Secret PIN:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={4}
                    value={ownerPin}
                    onChange={(e) => {
                      setOwnerPin(e.target.value);
                      setPinError('');
                    }}
                    placeholder="Enter 4-digit Owner PIN (e.g. 0000)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-mono font-bold tracking-widest text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                  <span>Authorized PINs: 0000 (Owner), 9999 (Manager), 1234 (Dev)</span>
                  {pinError && <span className="text-rose-600 font-bold">{pinError}</span>}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">
                  Closing Notes & Vault Drop Reference:
                </label>
                <input
                  type="text"
                  value={zeroNotes}
                  onChange={(e) => setZeroNotes(e.target.value)}
                  placeholder="e.g. Banked to store vault by Chandan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Success Notification */}
              {isSuccessFeedback && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Drawer successfully swept to ₹0.00! Daily ledger locked.</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsZeroModalOpen(false)}
                  className="btn-press flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSuccessFeedback}
                  className="btn-press flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>Authorize & Sweep to ₹0</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
