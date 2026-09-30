import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  BarChart3,
  Download,
  Calendar,
  CreditCard,
  Layers,
  Users,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

export function ReportsView() {
  const {
    salesLedger,
    products,
    currentShift,
    shiftsHistory
  } = usePOS();

  const [reportType, setReportType] = useState('sales'); // 'sales' | 'payments' | 'products' | 'shifts'

  // Calculate Aggregates
  const totalRevenue = salesLedger.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalCash = salesLedger.filter(s => s.paymentMethod === 'CASH').reduce((sum, s) => sum + s.grandTotal, 0);
  const totalUpi = salesLedger.filter(s => s.paymentMethod === 'UPI').reduce((sum, s) => sum + s.grandTotal, 0);

  // Sales by product map
  const productSalesMap = {};
  salesLedger.forEach(s => {
    s.items.forEach(i => {
      if (!productSalesMap[i.productId]) {
        productSalesMap[i.productId] = {
          name: i.name,
          sku: i.sku,
          qtySold: 0,
          revenue: 0
        };
      }
      productSalesMap[i.productId].qtySold += i.quantity;
      productSalesMap[i.productId].revenue += i.lineTotal;
    });
  });

  const productReportList = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

  // CSV Export utility
  const handleExportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (reportType === 'sales') {
      csvContent += "Invoice,Date,Customer,Cashier,Method,Subtotal,Discount,Tax,GrandTotal\n";
      salesLedger.forEach(s => {
        csvContent += `"${s.invoiceNumber}","${s.createdAt}","${s.customerName}","${s.cashierName}","${s.paymentMethod}",${s.subtotal},${s.discountTotal},${s.taxTotal},${s.grandTotal}\n`;
      });
    } else if (reportType === 'products') {
      csvContent += "Product,SKU,QuantitySold,Revenue\n";
      productReportList.forEach(p => {
        csvContent += `"${p.name}","${p.sku}",${p.qtySold},${p.revenue}\n`;
      });
    } else {
      csvContent += "Type,Amount\n";
      csvContent += `"Cash Collection",${totalCash}\n`;
      csvContent += `"UPI Instant Collection",${totalUpi}\n`;
      csvContent += `"Total Revenue",${totalRevenue}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CROS_Report_${reportType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 font-heading">
            Executive Reports & Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-grade business intelligence across sales, payment modes, and product margins
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="btn-press px-4 py-2.5 rounded-full bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-brand flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Statement</span>
        </button>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
        <button
          onClick={() => setReportType('sales')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === 'sales' ? 'bg-[#1e1e1e] text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Detailed Sales Register
        </button>
        <button
          onClick={() => setReportType('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === 'payments' ? 'bg-[#1e1e1e] text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Cash & UPI Reconciliation
        </button>
        <button
          onClick={() => setReportType('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === 'products' ? 'bg-[#1e1e1e] text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Product Velocity & Turn
        </button>
      </div>

      {/* Report View Panel */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {reportType === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 pl-4">Invoice No</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Customer</th>
                  <th className="py-3">Cashier</th>
                  <th className="py-3">Tender</th>
                  <th className="py-3 text-right">Subtotal</th>
                  <th className="py-3 text-right">Discounts</th>
                  <th className="py-3 text-right">GST</th>
                  <th className="py-3 pr-4 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {salesLedger.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-4 font-mono font-bold text-slate-900">{s.invoiceNumber}</td>
                    <td className="py-3 text-slate-500 font-mono text-[11px]">
                      {new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-slate-800">{s.customerName}</td>
                    <td className="py-3 text-slate-500">{s.cashierName}</td>
                    <td className="py-3">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono">₹{s.subtotal}</td>
                    <td className="py-3 text-right font-mono text-emerald-600">₹{s.discountTotal}</td>
                    <td className="py-3 text-right font-mono text-slate-500">₹{s.taxTotal}</td>
                    <td className="py-3 pr-4 text-right font-mono font-extrabold text-slate-900">
                      ₹{s.grandTotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'payments' && (
          <div className="p-6 flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                  Total Cash Received
                </span>
                <span className="text-2xl font-extrabold font-mono text-emerald-950 mt-1 block">
                  ₹{totalCash.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-emerald-700">Verified cash in register drawer</span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800 block">
                  Total UPI Instant Settlements
                </span>
                <span className="text-2xl font-extrabold font-mono text-blue-950 mt-1 block">
                  ₹{totalUpi.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-blue-700">Direct merchant bank settlements</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Total Net Revenue
                </span>
                <span className="text-2xl font-extrabold font-mono text-slate-900 mt-1 block">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-500">Across all payment channels</span>
              </div>
            </div>
          </div>
        )}

        {reportType === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 pl-4">Product Name</th>
                  <th className="py-3">SKU</th>
                  <th className="py-3 text-center">Units Sold</th>
                  <th className="py-3 pr-4 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {productReportList.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 font-mono text-slate-500">{p.sku}</td>
                    <td className="py-3 text-center font-mono font-bold text-slate-800">{p.qtySold}</td>
                    <td className="py-3 pr-4 text-right font-mono font-extrabold text-slate-900">
                      ₹{p.revenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
