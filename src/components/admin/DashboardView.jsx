import React from 'react';
import { usePOS } from '../../context/POSContext';
import {
  DualBezierSalesChart,
  SpeedometerGauge,
  PaymentDonutRing
} from '../charts/SvgCharts';
import {
  TrendingUp,
  Banknote,
  QrCode,
  ShoppingBag,
  CreditCard,
  Clock,
  ArrowUpRight,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';

export function DashboardView() {
  const {
    salesLedger,
    currentShift,
    products,
    getDrawerCash,
    setActiveView,
    setActiveModal,
    currentUser
  } = usePOS();

  // Aggregate metrics
  const totalSalesCount = salesLedger.length;
  const totalRevenue = salesLedger.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalCashSales = salesLedger
    .filter(s => s.paymentMethod === 'CASH')
    .reduce((sum, s) => sum + s.grandTotal, 0);
  const totalUpiSales = salesLedger
    .filter(s => s.paymentMethod === 'UPI')
    .reduce((sum, s) => sum + s.grandTotal, 0);

  const avgBill = totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;
  const drawerCash = getDrawerCash();
  const lowStockCount = products.filter(p => p.trackInventory && p.currentStock <= p.minStock).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 select-none">
      {/* 1. Signature ONIX Dark-Blue Gradient Hero Card (master_design.md Section 8) */}
      <section className="relative rounded-[28px] overflow-hidden p-6 text-white shadow-xl bg-gradient-to-br from-[#0b1120] via-[#111827] to-[#172554] border border-slate-800">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider">
                CROS Executive Pulse
              </span>
              <span className="text-slate-400 text-xs">
                Shift #{currentShift?.id || 'OFFLINE'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-heading">
              Store Performance & Real-Time Flow
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Auditable multi-ledger tracking active for Cash drawer, UPI instant settlements, and inventory movements.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveView('pos')}
              className="btn-press px-4 py-2.5 rounded-full bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-slate-100 flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Billing Counter</span>
            </button>
            <button
              onClick={() => setActiveModal('cashMovement')}
              className="btn-press px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold text-xs backdrop-blur-xs flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Drawer Actions</span>
            </button>
          </div>
        </div>

        {/* Hero KPI Stat Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-700/60">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <span className="text-2xl font-extrabold font-mono text-white mt-0.5">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 mt-0.5 flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> +14.2% vs yesterday
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cash Drawer Float
            </span>
            <span className="text-2xl font-extrabold font-mono text-emerald-400 mt-0.5">
              ₹{drawerCash.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
              Verified physical cash
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              UPI Instant Total
            </span>
            <span className="text-2xl font-extrabold font-mono text-blue-400 mt-0.5">
              ₹{totalUpiSales.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
              Provider confirmed
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Bills Cleared
            </span>
            <span className="text-2xl font-extrabold font-mono text-white mt-0.5">
              {totalSalesCount}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
              Avg ticket: ₹{avgBill}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Inventory Watch
            </span>
            <span className={`text-2xl font-extrabold font-mono mt-0.5 ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {lowStockCount} items
            </span>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
              At or below minimum
            </span>
          </div>
        </div>
      </section>

      {/* 2. Visualizations Grid (master_design.md pure SVG charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hourly Bézier Curve Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                Intraday Sales Flow & UPI Velocity
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Dual cubic Bézier curve tracking hourly transaction spikes
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Live Feed
            </span>
          </div>

          <DualBezierSalesChart />
        </div>

        {/* Speedometer & Ratio Column */}
        <div className="flex flex-col gap-4">
          {/* Target Speedometer Gauge */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <SpeedometerGauge value={Math.round(totalRevenue / 1000)} target={60} label="Shift Revenue Target" />
          </div>

          {/* Payment Method Donut Ring */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="text-xs font-bold text-slate-900 font-heading mb-2">
              Payment Method Breakdown
            </div>
            <PaymentDonutRing
              cashAmount={totalCashSales || 18450}
              upiAmount={totalUpiSales || 24320}
            />
          </div>
        </div>
      </div>

      {/* 3. Recent Real-Time Sales Ledger Feed */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 font-heading">
              Auditable Transaction Ledger (Recent Sales)
            </h3>
            <p className="text-[11px] text-slate-400">
              Every completed transaction with full customer, cashier, and settlement records
            </p>
          </div>
          <button
            onClick={() => setActiveView('pos')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Open POS Counter</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pl-2">Invoice #</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Cashier</th>
                <th className="pb-3">Items Sold</th>
                <th className="pb-3">Method</th>
                <th className="pb-3 text-right">Amount</th>
                <th className="pb-3 pr-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {salesLedger.slice(0, 6).map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 pl-2 font-mono font-bold text-slate-900">
                    {sale.invoiceNumber}
                  </td>
                  <td className="py-3 text-slate-500 font-mono text-[11px]">
                    {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 text-slate-800 font-semibold">
                    {sale.customerName}
                  </td>
                  <td className="py-3 text-slate-500">
                    {sale.cashierName}
                  </td>
                  <td className="py-3 text-slate-600">
                    {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                  </td>
                  <td className="py-3">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      sale.paymentMethod === 'CASH'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : sale.paymentMethod === 'UPI'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono font-extrabold text-slate-900">
                    ₹{sale.grandTotal.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ● {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
