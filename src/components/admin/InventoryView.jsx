import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  AlertTriangle,
  RotateCw,
  Search,
  CheckCircle2,
  FileText,
  Truck,
  X,
  ArrowRight
} from 'lucide-react';

export function InventoryView() {
  const {
    products,
    stockLedger,
    adjustStock,
    purchaseOrders,
    receivePurchaseOrder,
    createPurchaseOrder,
    suppliers
  } = usePOS();

  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'stock' | 'po'
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);

  // Stock Adjustment Form
  const [adjustProductId, setAdjustProductId] = useState(products[0]?.id || '');
  const [adjustDelta, setAdjustDelta] = useState('');
  const [adjustReason, setAdjustReason] = useState('Recount Variance');

  // Purchase Order Form
  const [poSupplierId, setPoSupplierId] = useState(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState([
    { productId: products[0]?.id || '', quantity: 50, costPrice: products[0]?.costPrice || 30 }
  ]);

  const totalInventoryValuation = products.reduce((sum, p) => sum + p.currentStock * p.costPrice, 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);
  const lowStockItems = products.filter(p => p.trackInventory && p.currentStock <= p.minStock);

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!adjustDelta || Number(adjustDelta) === 0) return;
    adjustStock({
      productId: adjustProductId,
      delta: Number(adjustDelta),
      reason: adjustReason,
      referenceType: 'ADJUSTMENT'
    });
    setIsAdjustModalOpen(false);
    setAdjustDelta('');
  };

  const handlePoSubmit = (e) => {
    e.preventDefault();
    createPurchaseOrder({
      supplierId: poSupplierId,
      items: poItems.map(i => {
        const prod = products.find(p => p.id === i.productId);
        return {
          ...i,
          name: prod?.name || 'Product',
          quantity: Number(i.quantity),
          costPrice: Number(i.costPrice)
        };
      })
    });
    setIsPoModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 select-none">
      {/* Inventory KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
            Inventory Valuation (Cost)
          </span>
          <span className="text-xl font-extrabold font-mono text-slate-900 mt-1 block">
            ₹{totalInventoryValuation.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-400">At wholesale cost price</span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
            Retail Sales Value
          </span>
          <span className="text-xl font-extrabold font-mono text-emerald-600 mt-1 block">
            ₹{totalRetailValuation.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-400">Expected sales realization</span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
            Catalog Items Tracked
          </span>
          <span className="text-xl font-extrabold font-mono text-slate-900 mt-1 block">
            {products.length} SKUs
          </span>
          <span className="text-[10px] text-slate-400">All live inventory active</span>
        </div>

        <div className={`p-4 rounded-3xl border shadow-2xs ${
          lowStockItems.length > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200/80'
        }`}>
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-800 block">
            Low Stock Alerts
          </span>
          <span className="text-xl font-extrabold font-mono text-amber-900 mt-1 block">
            {lowStockItems.length} Products
          </span>
          <span className="text-[10px] text-amber-700">Immediate re-order advised</span>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'ledger' ? 'bg-[#1e1e1e] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Immutable Stock Ledger
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'stock' ? 'bg-[#1e1e1e] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Current Stock Levels
          </button>
          <button
            onClick={() => setActiveTab('po')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'po' ? 'bg-[#1e1e1e] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Purchase Orders & Receiving
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="btn-press px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Stock Adjustment</span>
          </button>
          <button
            onClick={() => setIsPoModalOpen(true)}
            className="btn-press px-3.5 py-2 rounded-xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-brand flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Tab 1: IMMUTABLE STOCK LEDGER (Section 21 of brain.md) */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading">
                Stock Movements Ledger Trail
              </h3>
              <p className="text-[11px] text-slate-400">
                Every sale, purchase receipt, adjustment, and return leaves an auditable transaction entry
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Total {stockLedger.length} Movements Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pl-4">Timestamp</th>
                  <th className="py-2.5">Product / SKU</th>
                  <th className="py-2.5">Event Type</th>
                  <th className="py-2.5">Ref ID</th>
                  <th className="py-2.5 text-center">Movement (Delta)</th>
                  <th className="py-2.5 text-center">Prev → New</th>
                  <th className="py-2.5">Audit Reason</th>
                  <th className="py-2.5 pr-4 text-right">Handled By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {stockLedger.map((entry) => {
                  const isPositive = entry.delta > 0;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 pl-4 font-mono text-[11px] text-slate-500">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: '2-digit' })}
                      </td>
                      <td className="py-2.5">
                        <div className="font-bold text-slate-900">{entry.productName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{entry.sku}</div>
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          entry.type === 'SALE'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : entry.type === 'PURCHASE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : entry.type === 'RETURN'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-700 text-[11px]">
                        {entry.referenceId}
                      </td>
                      <td className="py-2.5 text-center font-mono font-bold">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {isPositive ? `+${entry.delta}` : entry.delta}
                        </span>
                      </td>
                      <td className="py-2.5 text-center font-mono text-slate-500 text-[11px]">
                        {entry.prevStock} → <strong className="text-slate-900">{entry.newStock}</strong>
                      </td>
                      <td className="py-2.5 text-slate-600 text-[11px] max-w-xs truncate">
                        {entry.reason}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-slate-500 text-[11px]">
                        {entry.user}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: CURRENT STOCK LEVELS */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading">
              Current Physical & System Stock Balances
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 pl-4">Product</th>
                  <th className="py-3">SKU</th>
                  <th className="py-3">Category</th>
                  <th className="py-3 text-right">In Stock</th>
                  <th className="py-3 text-right">Threshold</th>
                  <th className="py-3 text-right">Valuation (Cost)</th>
                  <th className="py-3 pr-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map((p) => {
                  const isOutOfStock = p.currentStock <= 0;
                  const isLow = p.currentStock <= p.minStock && p.currentStock > 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-4 font-bold text-slate-900 flex items-center gap-2">
                        <span className="text-xl">{p.image}</span>
                        <span>{p.name}</span>
                      </td>
                      <td className="py-3 font-mono text-slate-500">{p.sku}</td>
                      <td className="py-3 text-slate-600">{p.category}</td>
                      <td className="py-3 text-right font-mono font-extrabold text-sm text-slate-900">
                        {p.currentStock} {p.unit}s
                      </td>
                      <td className="py-3 text-right font-mono text-slate-400">
                        {p.minStock} {p.unit}s
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-800">
                        ₹{(p.currentStock * p.costPrice).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: PURCHASE ORDERS & RECEIVING */}
      {activeTab === 'po' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading">
                Supplier Purchase Orders (Goods Receiving Flow)
              </h3>
              <p className="text-[11px] text-slate-400">
                Marking a PO "Received" automatically increases product stock and writes to the stock ledger
              </p>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            {purchaseOrders.map((po) => (
              <div
                key={po.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900 font-mono">{po.id}</span>
                    <span className="text-xs font-bold text-slate-800">{po.supplierName}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      po.status === 'RECEIVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {po.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Created: {new Date(po.createdAt).toLocaleDateString('en-IN')} • Items: {po.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase text-slate-400">Order Cost</div>
                    <div className="text-sm font-extrabold font-mono text-slate-900">
                      ₹{po.totalCost.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {po.status !== 'RECEIVED' ? (
                    <button
                      onClick={() => receivePurchaseOrder(po.id)}
                      className="btn-press px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Goods Received</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Stock Ingested
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="animate-spring-modal bg-white w-full max-w-md rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#1e1e1e] text-white flex items-center justify-center">
                  <RotateCw className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Create Auditable Stock Adjustment
                </h3>
              </div>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 flex flex-col gap-3">
              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Product
                </label>
                <select
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Current Stock: {p.currentStock})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Stock Change (Delta +/-)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. -3 (Damaged) or +10 (Found in backroom)"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  className="w-full font-mono text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Audit Reason
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                >
                  <option>Recount Physical Variance</option>
                  <option>Damaged / Broken in Transit</option>
                  <option>Expired / Spoilage</option>
                  <option>Store Consumption / Testing</option>
                  <option>Missing / Shrinkage</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-press w-full py-3.5 rounded-2xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-brand mt-2 flex items-center justify-center gap-2"
              >
                <span>Commit to Stock Ledger</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Purchase Order Modal */}
      {isPoModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="animate-spring-modal bg-white w-full max-w-lg rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#1e1e1e] text-white flex items-center justify-center">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Create Supplier Purchase Order
                </h3>
              </div>
              <button onClick={() => setIsPoModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePoSubmit} className="p-5 flex flex-col gap-3.5">
              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Select Supplier
                </label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.contact})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Item to Reorder
                </label>
                <select
                  value={poItems[0]?.productId}
                  onChange={(e) => {
                    const prod = products.find(p => p.id === e.target.value);
                    setPoItems([{ productId: e.target.value, quantity: 50, costPrice: prod?.costPrice || 30 }]);
                  }}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Order Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={poItems[0]?.quantity}
                    onChange={(e) => setPoItems([{ ...poItems[0], quantity: e.target.value }])}
                    className="w-full font-mono text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Wholesale Cost (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={poItems[0]?.costPrice}
                    onChange={(e) => setPoItems([{ ...poItems[0], costPrice: e.target.value }])}
                    className="w-full font-mono text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-press w-full py-3.5 rounded-2xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-brand mt-2 flex items-center justify-center gap-2"
              >
                <span>Dispatch Purchase Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
