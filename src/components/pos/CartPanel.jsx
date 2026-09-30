import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { ProductImage } from '../../utils/imageHelper';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  User,
  PauseCircle,
  Sparkles,
  ArrowRight,
  Percent,
  Check
} from 'lucide-react';

export function CartPanel() {
  const {
    cart,
    cartTotals,
    addToCart,
    updateCartItemQty,
    removeFromCart,
    clearCart,
    customers,
    setCustomerForCart,
    setOrderDiscount,
    holdCurrentOrder,
    setActiveModal
  } = usePOS();

  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState('fixed');
  const [discountVal, setDiscountVal] = useState(0);

  const handleApplyDiscount = () => {
    setOrderDiscount(discountType, discountVal);
    setIsDiscountModalOpen(false);
  };

  return (
    <aside className="w-96 flex flex-col bg-white border border-slate-200/80 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.03)] overflow-hidden h-[calc(100vh-5rem)] my-2 mr-4 select-none">
      {/* Cart Header & Customer Selector */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1e1e1e] text-white flex items-center justify-center">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-extrabold text-slate-900 font-heading">Current Cart</h2>
            <span className="text-[10px] font-semibold text-slate-400">
              {cartTotals.itemCount} {cartTotals.itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {/* Customer Pill */}
        <div className="relative">
          <button
            onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
            className="btn-press flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-100"
          >
            <User className="w-3 h-3 text-slate-500" />
            <span className="truncate max-w-[100px]">{cart.customerName}</span>
          </button>

          {isCustomerDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-30 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Select Customer
              </span>
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCustomerForCart(c);
                    setIsCustomerDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-semibold ${
                    cart.customerId === c.id
                      ? 'bg-[#1e1e1e] text-white'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div>{c.name}</div>
                    <div className={`text-[10px] font-mono ${cart.customerId === c.id ? 'text-slate-300' : 'text-slate-400'}`}>
                      {c.phone}
                    </div>
                  </div>
                  {c.loyaltyPoints > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      ★ {c.loyaltyPoints}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Items List with Real Product Photography */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-600">Cart is Empty</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[180px]">
              Scan a barcode or tap products from the catalog to add items
            </p>
          </div>
        ) : (
          cart.items.map((item) => (
            <div
              key={item.productId}
              className="p-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between gap-2 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    category={item.category}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {item.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-mono">
                    <span>₹{item.unitPrice}</span>
                    <span>×</span>
                    <span className="font-bold text-slate-700">{item.quantity}</span>
                    {item.taxRate > 0 && (
                      <span className="text-[9px] bg-slate-200/80 px-1 rounded text-slate-600">
                        GST {item.taxRate}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity Controls & Total */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                  <button
                    onClick={() => updateCartItemQty(item.productId, item.quantity - 1)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
                    title="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold font-mono text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartItemQty(item.productId, item.quantity + 1)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
                    title="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right min-w-[55px]">
                  <div className="text-xs font-extrabold font-mono text-slate-900">
                    ₹{item.lineTotal.toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-1 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                  title="Remove from cart"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Total Breakdown */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col gap-2">
        {/* Discount Trigger */}
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => setIsDiscountModalOpen(!isDiscountModalOpen)}
            className="flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-semibold"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>
              {cartTotals.orderDiscount > 0
                ? `Discount: -₹${cartTotals.orderDiscount}`
                : '+ Apply Order Discount'}
            </span>
          </button>
          {cart.items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Financial Lines */}
        <div className="flex flex-col gap-1 text-[11.5px] text-slate-600 font-medium pt-1 border-t border-slate-200/60">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono text-slate-900">₹{cartTotals.subtotal.toFixed(2)}</span>
          </div>

          {cartTotals.totalDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Total Discounts</span>
              <span className="font-mono">-₹{cartTotals.totalDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-500">
            <span>Taxes (GST)</span>
            <span className="font-mono">+₹{cartTotals.taxTotal.toFixed(2)}</span>
          </div>

          {cartTotals.rounding !== 0 && (
            <div className="flex justify-between text-slate-400 text-[10px]">
              <span>Round-off</span>
              <span className="font-mono">{cartTotals.rounding >= 0 ? '+' : ''}{cartTotals.rounding.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="mt-1 p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Due
            </span>
            <span className="text-xl font-extrabold text-[#111827] font-mono tracking-tight">
              ₹{cartTotals.grandTotal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-[10.5px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Auto-Rounded
          </div>
        </div>

        {/* Action Controls: Hold & Charge */}
        <div className="grid grid-cols-3 gap-2 mt-1">
          <button
            onClick={() => holdCurrentOrder()}
            disabled={cart.items.length === 0}
            className="btn-press py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-xs"
            title="Park current order"
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span>Hold</span>
          </button>

          <button
            onClick={() => setActiveModal('checkout')}
            disabled={cart.items.length === 0}
            className="btn-press col-span-2 py-3 rounded-2xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-[0_4px_14px_rgba(0,0,0,0.2)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>Charge</span>
            <span className="font-mono text-sm font-extrabold">
              ₹{cartTotals.grandTotal.toLocaleString('en-IN')}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Discount Mini Modal */}
      {isDiscountModalOpen && (
        <div className="p-3 bg-blue-50 border-t border-blue-200 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900">
            <span>Apply Order Discount</span>
            <button onClick={() => setIsDiscountModalOpen(false)} className="text-blue-500">×</button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDiscountType('fixed')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                discountType === 'fixed' ? 'bg-blue-600 text-white' : 'bg-white text-blue-800'
              }`}
            >
              Fixed ₹
            </button>
            <button
              onClick={() => setDiscountType('percentage')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                discountType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-white text-blue-800'
              }`}
            >
              Percentage %
            </button>
            <input
              type="number"
              value={discountVal}
              onChange={(e) => setDiscountVal(Number(e.target.value))}
              placeholder="Value"
              className="w-20 px-2 py-1 rounded-lg bg-white border border-blue-200 text-xs font-mono font-bold outline-none"
            />
            <button
              onClick={handleApplyDiscount}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold ml-auto"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
