import React from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Printer,
  Copy,
  Check,
  X,
  FileText,
  ShoppingBag,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function ReceiptModal() {
  const {
    activeModal,
    setActiveModal,
    lastCompletedSale,
    storeConfig,
    clearCart
  } = usePOS();

  if (activeModal !== 'receipt' || !lastCompletedSale) return null;

  const { sale, payments, cashReceived, changeGiven, method } = lastCompletedSale;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setActiveModal(null);
  };

  const formattedDate = new Date(sale.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="animate-spring-modal bg-white w-full max-w-md rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Modal Topbar Controls */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold text-slate-800">
              Transaction Completed Successfully
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Paper Container */}
        <div className="p-6 bg-slate-50 flex justify-center">
          <div
            id="thermal-receipt"
            className="w-full max-w-[340px] bg-white p-5 rounded-2xl shadow-sm border border-slate-200 text-slate-800 font-mono text-xs flex flex-col gap-2.5"
          >
            {/* Header / Store Brand */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-900 font-heading">
                {storeConfig.name}
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                {storeConfig.address}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Tel: {storeConfig.phone} | GSTIN: {storeConfig.gstin}
              </p>
              <div className="mt-1 flex items-center justify-center gap-1.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  {lastCompletedSale.isExchange ? 'Product Exchange Voucher' : 'Tax Invoice / Cash Memo'}
                </span>
              </div>
            </div>

            {/* 8-Digit TxHash Badge */}
            <div className="bg-slate-900 text-white rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-bold">
                  8-Digit TxHash Code
                </span>
                <span className="font-mono text-sm font-extrabold tracking-widest text-emerald-400">
                  {sale.txHash || '8X9K2M4P'}
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(sale.txHash || '');
                  alert(`Transaction Hash copied: ${sale.txHash}`);
                }}
                title="Copy Hash"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Invoice Meta */}
            <div className="flex flex-col gap-0.5 text-[11px] pb-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice No:</span>
                <span className="font-bold text-slate-900">{sale.invoiceNumber}</span>
              </div>
              {lastCompletedSale.isExchange && sale.originalTxHash && (
                <div className="flex justify-between text-indigo-700 font-bold">
                  <span>Original TxHash:</span>
                  <span>{sale.originalTxHash}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Date/Time:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier:</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900">
                  {sale.customerName} {sale.customerPhone && sale.customerPhone !== '—' ? `(${sale.customerPhone})` : ''}
                </span>
              </div>
            </div>

            {/* Exchange Breakdown (If Exchange) */}
            {lastCompletedSale.isExchange && (
              <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-[10.5px]">
                <div className="font-bold text-indigo-900 uppercase tracking-wider text-[9.5px]">
                  Exchange Item Details
                </div>
                
                {/* Returned Items */}
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[9.5px] uppercase font-bold">1. Returned Items (Credit):</span>
                  {lastCompletedSale.returnedItems?.map((ret, i) => (
                    <div key={i} className="flex justify-between text-rose-700">
                      <span>• {ret.name} ({ret.quantity}×)</span>
                      <span className="font-bold">-₹{(ret.unitPrice * ret.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Replacement Items */}
                <div className="flex flex-col gap-1 pt-1 border-t border-indigo-200">
                  <span className="text-slate-500 text-[9.5px] uppercase font-bold">2. New Items Taken:</span>
                  {sale.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-emerald-800">
                      <span>• {item.name} ({item.quantity}×)</span>
                      <span className="font-bold">+₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Exchange Balance Settlement */}
                <div className="flex justify-between items-center pt-1.5 border-t border-indigo-200 font-extrabold text-xs">
                  <span>Exchange Balance:</span>
                  <span className={
                    lastCompletedSale.differenceAmount > 0
                      ? 'text-rose-700'
                      : lastCompletedSale.differenceAmount < 0
                      ? 'text-emerald-700'
                      : 'text-slate-700'
                  }>
                    {lastCompletedSale.differenceAmount > 0
                      ? `Customer Paid: +₹${lastCompletedSale.differenceAmount}`
                      : lastCompletedSale.differenceAmount < 0
                      ? `Refund Given: -₹${Math.abs(lastCompletedSale.differenceAmount)}`
                      : 'Even Swap (₹0.00)'}
                  </span>
                </div>
              </div>
            )}

            {/* Line Items Table (For standard sales) */}
            {!lastCompletedSale.isExchange && (
              <div className="flex flex-col gap-1.5 pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                  <span>Item</span>
                  <span className="text-right">Qty × Rate | Total</span>
                </div>

                {sale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] leading-tight">
                    <div className="truncate max-w-[170px]">
                      <div className="font-bold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[9.5px] text-slate-400">SKU: {item.sku}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div>₹{item.lineTotal.toFixed(2)}</div>
                      <div className="text-[9.5px] text-slate-400">
                        {item.quantity} × ₹{item.unitPrice}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Financial Summary */}
            {!lastCompletedSale.isExchange && (
              <div className="flex flex-col gap-1 text-[11px] pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span>₹{sale.subtotal.toFixed(2)}</span>
                </div>

                {sale.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount:</span>
                    <span>-₹{sale.discountTotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500">
                  <span>Tax (GST Breakdown):</span>
                  <span>₹{sale.taxTotal.toFixed(2)}</span>
                </div>

                {sale.rounding !== 0 && (
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Round-off:</span>
                    <span>{sale.rounding >= 0 ? '+' : ''}{sale.rounding.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                  <span>GRAND TOTAL:</span>
                  <span>₹{sale.grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* Explicit Payment Breakdown (The key from PRD) */}
            <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Payment Mode:</span>
                <span className="uppercase">{sale.paymentMethod}</span>
              </div>

              {sale.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Cash Tendered:</span>
                    <span className="font-bold">₹{cashReceived?.toLocaleString('en-IN') || (sale.grandTotal || 0)}</span>
                  </div>
                  {changeGiven > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold text-xs pt-0.5 border-t border-slate-200">
                      <span>Change Returned:</span>
                      <span>₹{changeGiven.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </>
              )}

              {sale.paymentMethod === 'UPI' && (
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>UPI Ref:</span>
                  <span className="font-mono truncate max-w-[180px]">
                    {payments?.[0]?.providerTxnId || 'UPI/VERIFIED'}
                  </span>
                </div>
              )}

              {sale.paymentMethod === 'SPLIT' && (
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>Split:</span>
                  <span>Cash: ₹{payments?.[0]?.amountReceived} | UPI: ₹{payments?.[1]?.amountReceived}</span>
                </div>
              )}
            </div>

            {/* Footer Barcode Graphic & Note */}
            <div className="text-center pt-2 flex flex-col items-center">
              {/* Simulated Thermal Barcode */}
              <div className="flex items-center gap-[2px] h-9 mb-1.5 opacity-80">
                {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2, 1, 4, 2].map((w, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 h-full"
                    style={{ width: `${w * 1.5}px` }}
                  />
                ))}
              </div>
              <span className="text-[9.5px] font-mono tracking-widest text-slate-400">
                {sale.txHash || sale.invoiceNumber}
              </span>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">
                {storeConfig.receiptFooterNote}
              </p>
              <p className="text-[9px] text-slate-400 mt-1">
                Powered by CROS — CrossTech Retail OS
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="btn-press flex-1 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-2 shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Thermal Receipt</span>
          </button>

          <button
            onClick={handleClose}
            className="btn-press flex-1 py-3 rounded-2xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-brand"
          >
            <span>Start New Sale</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
