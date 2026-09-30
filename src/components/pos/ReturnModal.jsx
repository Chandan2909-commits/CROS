import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { ProductImage } from '../../utils/imageHelper';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Package,
  ArrowLeftRight,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Hash
} from 'lucide-react';

export function ReturnModal() {
  const {
    activeModal,
    setActiveModal,
    salesLedger,
    products,
    processRefund,
    processExchange
  } = usePOS();

  if (activeModal !== 'return') return null;

  const [activeTab, setActiveTab] = useState('exchange'); // 'exchange' or 'refund'
  const [searchInvoice, setSearchInvoice] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [refundReason, setRefundReason] = useState('Customer Exchanged Product');
  const [refundMethod, setRefundMethod] = useState('CASH');

  // Exchange replacement items state: array of { productId, name, unitPrice, quantity, image, category }
  const [replacementItems, setReplacementItems] = useState([]);
  const [replacementSearch, setReplacementSearch] = useState('');

  const matchingSales = salesLedger.filter(s =>
    (s.txHash && s.txHash.toLowerCase().includes(searchInvoice.toLowerCase())) ||
    s.invoiceNumber.toLowerCase().includes(searchInvoice.toLowerCase()) ||
    s.customerName.toLowerCase().includes(searchInvoice.toLowerCase()) ||
    (s.customerPhone && s.customerPhone.includes(searchInvoice))
  ).slice(0, 8);

  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    const initialQty = {};
    sale.items.forEach(i => {
      initialQty[i.productId] = 0;
    });
    setReturnQuantities(initialQty);
    setReplacementItems([]);
  };

  const calculateReturnTotal = () => {
    if (!selectedSale) return 0;
    return selectedSale.items.reduce((sum, item) => {
      const qty = returnQuantities[item.productId] || 0;
      return sum + item.unitPrice * qty;
    }, 0);
  };

  const calculateReplacementTotal = () => {
    return replacementItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const returnTotal = calculateReturnTotal();
  const replacementTotal = calculateReplacementTotal();
  const exchangeDifference = Math.round(replacementTotal - returnTotal); // >0 = customer pays extra, <0 = refund due, 0 = even

  // Add replacement product
  const handleAddReplacement = (prod) => {
    setReplacementItems(prev => {
      const existing = prev.find(p => p.productId === prod.id);
      if (existing) {
        return prev.map(p => p.productId === prod.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, {
        productId: prod.id,
        name: prod.name,
        unitPrice: prod.sellingPrice,
        quantity: 1,
        image: prod.image,
        category: prod.category
      }];
    });
    setReplacementSearch('');
  };

  const updateReplacementQty = (productId, newQty) => {
    if (newQty <= 0) {
      setReplacementItems(prev => prev.filter(p => p.productId !== productId));
    } else {
      setReplacementItems(prev => prev.map(p => p.productId === productId ? { ...p, quantity: newQty } : p));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSale) return;

    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const originalItem = selectedSale.items.find(i => i.productId === productId);
        return {
          productId,
          name: originalItem?.name || "Item",
          quantity,
          unitPrice: originalItem?.unitPrice || 0
        };
      });

    if (itemsToReturn.length === 0) {
      alert("Please specify at least 1 item quantity to return.");
      return;
    }

    if (activeTab === 'exchange') {
      if (replacementItems.length === 0) {
        alert("Please select at least 1 replacement product to complete the exchange!");
        return;
      }
      processExchange({
        originalTxHash: selectedSale.txHash || selectedSale.invoiceNumber,
        returnedItems: itemsToReturn,
        newItems: replacementItems,
        paymentMethod: refundMethod,
        notes: `Exchange: ${refundReason}`
      });
    } else {
      // Pure Refund
      processRefund({
        invoiceNumber: selectedSale.txHash || selectedSale.invoiceNumber,
        itemsToReturn,
        refundMethod,
        reason: refundReason
      });
    }
  };

  const filteredCatalog = replacementSearch.trim() ? products.filter(p =>
    p.active && (
      p.name.toLowerCase().includes(replacementSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(replacementSearch.toLowerCase())
    )
  ).slice(0, 4) : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="animate-spring-modal bg-white w-full max-w-2xl rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1e1e1e] text-white flex items-center justify-center">
              {activeTab === 'exchange' ? <ArrowLeftRight className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                Returns & Product Exchange Portal
              </h2>
              <span className="text-[11px] font-semibold text-slate-400">
                Tracked by 8-Digit TxHash • Restocks & re-allocates stock
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

        {/* Tab Switcher: Exchange vs Pure Refund */}
        <div className="flex items-center p-2 bg-slate-100/70 border-b border-slate-200/80 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('exchange')}
            className={`btn-press flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'exchange'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
            <span>Product Exchange (Swap & Balance)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('refund')}
            className={`btn-press flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'refund'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Pure Refund (Cash / UPI Back)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto">
          {!selectedSale ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 gap-2 focus-within:border-slate-800">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter 8-digit TxHash (e.g. 8X9K2M4P), Invoice #, or customer phone..."
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-slate-900 outline-none placeholder-slate-400"
                />
              </div>

              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Completed Invoices with 8-Digit TxHash
              </span>
              <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5">
                {matchingSales.map((sale) => (
                  <button
                    key={sale.id}
                    type="button"
                    onClick={() => handleSelectSale(sale)}
                    className="btn-press flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-left hover:bg-slate-50/60"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{sale.invoiceNumber}</span>
                        {sale.txHash && (
                          <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                            TxHash: {sale.txHash}
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] text-slate-400 mt-0.5">
                        {sale.customerName} {sale.customerPhone && sale.customerPhone !== '—' && `(${sale.customerPhone})`} • {new Date(sale.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold font-mono text-slate-900">
                        ₹{sale.grandTotal}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">
                        {sale.paymentMethod}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Selected Bill Header Badge */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{selectedSale.invoiceNumber}</span>
                    <span className="font-mono font-extrabold text-[10.5px] bg-[#1e1e1e] text-white px-2 py-0.5 rounded-md">
                      TxHash: {selectedSale.txHash || '8X9K2M4P'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Purchased on {new Date(selectedSale.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span>•</span>
                    <span>{selectedSale.customerName}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Change Bill
                </button>
              </div>

              {/* 1. Items to Return */}
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Step 1: Select Items & Quantities to Return
                </span>
                <div className="flex flex-col gap-1.5">
                  {selectedSale.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-[240px]">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          <ProductImage src={item.image} alt={item.name} category={item.category} />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-800 truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Purchased: {item.quantity} × ₹{item.unitPrice}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">Return Qty:</span>
                        <input
                          type="number"
                          min={0}
                          max={item.quantity}
                          value={returnQuantities[item.productId] || 0}
                          onChange={(e) => {
                            const val = Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0));
                            setReturnQuantities({ ...returnQuantities, [item.productId]: val });
                          }}
                          className="w-14 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-200 rounded-xl py-1 outline-none focus:border-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2 for Exchange Mode: Pick Replacement Items */}
              {activeTab === 'exchange' && (
                <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-200/80 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                      Step 2: Select Replacement Products to Give
                    </span>
                    <span className="text-[10px] font-bold text-blue-700">
                      Replacement Total: ₹{replacementTotal}
                    </span>
                  </div>

                  {/* Search and add replacement product */}
                  <div className="relative">
                    <div className="flex items-center bg-white border border-blue-200 rounded-xl px-2.5 py-1.5 gap-2">
                      <Search className="w-3.5 h-3.5 text-blue-500" />
                      <input
                        type="text"
                        placeholder="Search replacement product from catalog..."
                        value={replacementSearch}
                        onChange={(e) => setReplacementSearch(e.target.value)}
                        className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>

                    {filteredCatalog.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 p-1 z-20 flex flex-col gap-1">
                        {filteredCatalog.map(prod => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => handleAddReplacement(prod)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 text-left text-xs font-semibold"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-slate-100 overflow-hidden">
                                <ProductImage src={prod.image} alt={prod.name} category={prod.category} />
                              </div>
                              <span>{prod.name}</span>
                            </div>
                            <span className="font-mono font-bold text-slate-900">₹{prod.sellingPrice}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* List of chosen replacement items */}
                  {replacementItems.length > 0 ? (
                    <div className="flex flex-col gap-1 mt-1">
                      {replacementItems.map(rep => (
                        <div key={rep.productId} className="flex items-center justify-between p-2 rounded-xl bg-white border border-blue-100 text-xs">
                          <span className="font-semibold text-slate-800">{rep.name}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span>₹{rep.unitPrice} × {rep.quantity} = ₹{rep.unitPrice * rep.quantity}</span>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                type="button"
                                onClick={() => updateReplacementQty(rep.productId, rep.quantity - 1)}
                                className="p-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateReplacementQty(rep.productId, rep.quantity + 1)}
                                className="p-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-blue-600/80 italic py-1 text-center">
                      No replacement item added yet. Search above to add items customer wants to take.
                    </div>
                  )}
                </div>
              )}

              {/* Reason & Tender Mode */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Reason
                  </span>
                  <select
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none"
                  >
                    <option>Product Size / Flavor Exchange</option>
                    <option>Customer Changed Mind</option>
                    <option>Defective / Packaging Damaged</option>
                    <option>Incorrect Item Purchased</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Difference Tender
                  </span>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none"
                  >
                    <option value="CASH">Cash (Shift Drawer Float)</option>
                    <option value="UPI">UPI / Digital Transfer</option>
                  </select>
                </div>
              </div>

              {/* Financial Calculation Banner */}
              {activeTab === 'exchange' ? (
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  exchangeDifference > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : exchangeDifference < 0
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div>
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider block">
                      {exchangeDifference > 0
                        ? 'Customer Pays Difference'
                        : exchangeDifference < 0
                        ? 'Refund Difference to Customer'
                        : 'Even Product Exchange (₹0 Due)'}
                    </span>
                    <span className="text-xl font-extrabold font-mono">
                      ₹{Math.abs(exchangeDifference).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right text-[11px] font-mono leading-tight">
                    <div>Return Credit: ₹{returnTotal.toFixed(2)}</div>
                    <div>Replacement: ₹{replacementTotal.toFixed(2)}</div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 block">
                      Total Refund to Customer
                    </span>
                    <span className="text-xl font-extrabold font-mono text-rose-950">
                      ₹{returnTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-rose-600 font-semibold max-w-[200px] text-right">
                    Deduction counted on purchase date ({new Date(selectedSale.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={returnTotal <= 0 || (activeTab === 'exchange' && replacementItems.length === 0)}
                className="btn-press w-full py-3.5 rounded-2xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-brand disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>{activeTab === 'exchange' ? 'Confirm & Record Product Exchange' : 'Process Refund & Restock'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
