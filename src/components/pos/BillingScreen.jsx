import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { CartPanel } from './CartPanel';
import { ProductImage } from '../../utils/imageHelper';
import {
  Search,
  Barcode,
  Star,
  Sparkles,
  Plus,
  AlertTriangle,
  Package,
  Layers,
  CheckCircle2,
  User,
  Phone,
  UserCheck,
  X,
  ArrowRight
} from 'lucide-react';

export function BillingScreen() {
  const {
    products,
    categories,
    addToCart,
    cart,
    customers,
    identifyCustomerForCart
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Customer Intake Gate State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [pendingProduct, setPendingProduct] = useState(null);

  // Check matching customer live as phone is entered
  const matchedExistingCustomer = useMemo(() => {
    const clean = phoneInput.replace(/[\s-+]/g, '');
    if (clean.length >= 4) {
      return customers.find(c => c.phone && c.phone.replace(/[\s-+]/g, '').includes(clean));
    }
    return null;
  }, [phoneInput, customers]);

  const handleStartBilling = (e) => {
    if (e) e.preventDefault();
    identifyCustomerForCart({
      name: nameInput || (matchedExistingCustomer ? matchedExistingCustomer.name : ''),
      phone: phoneInput
    });
    setIsCustomerModalOpen(false);

    if (pendingProduct) {
      addToCart(pendingProduct, 1);
      setPendingProduct(null);
    }
    setPhoneInput('');
    setNameInput('');
  };

  const handleSkipCustomer = () => {
    identifyCustomerForCart({ name: "Walk-in Customer", phone: "—" });
    setIsCustomerModalOpen(false);
    if (pendingProduct) {
      addToCart(pendingProduct, 1);
      setPendingProduct(null);
    }
  };

  const handleItemSelect = (product, qty = 1) => {
    if (!cart.customerIdentified) {
      setPendingProduct(product);
      setIsCustomerModalOpen(true);
      return;
    }
    addToCart(product, qty);
  };

  // Barcode scan simulator or direct barcode submission
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (!cart.customerIdentified) {
      setIsCustomerModalOpen(true);
      return;
    }

    // Check exact barcode match first
    const matchedByBarcode = products.find(p => p.barcode === searchQuery.trim());
    if (matchedByBarcode) {
      addToCart(matchedByBarcode, 1);
      setSearchQuery('');
      return;
    }

    // Check exact SKU match
    const matchedBySku = products.find(p => p.sku.toLowerCase() === searchQuery.trim().toLowerCase());
    if (matchedBySku) {
      addToCart(matchedBySku, 1);
      setSearchQuery('');
      return;
    }

    // If only 1 search result, add it
    if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0], 1);
      setSearchQuery('');
    }
  };

  // Filter products by category, search, favorites
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;
      if (showOnlyFavorites && !p.isFavorite) return false;
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          p.brand?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery, showOnlyFavorites]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Center: Product Catalog & Fast Billing Controls */}
      <main className="flex-1 flex flex-col overflow-hidden py-2 pl-4 pr-2">
        {/* Customer Identification Bar */}
        <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-2xl border border-slate-200/80 mb-2.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              cart.customerIdentified && cart.customerId !== 'CUST-WALK-IN'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}>
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Billed To:</span>
              <span className="font-bold text-slate-900">{cart.customerName}</span>
              {cart.customerPhone && cart.customerPhone !== '—' && (
                <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-[10.5px]">
                  {cart.customerPhone}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCustomerModalOpen(true)}
            className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100"
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>{cart.customerIdentified ? 'Change Customer' : 'Customer Info Required'}</span>
          </button>
        </div>

        {/* Top Controls: Barcode Search Bar & Quick Scanners */}
        <div className="flex items-center gap-3 mb-3">
          <form
            onSubmit={handleBarcodeSubmit}
            className="flex-1 relative flex items-center bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2.5 shadow-2xs focus-within:border-[#1e1e1e] focus-within:ring-2 focus-within:ring-[#1e1e1e]/10 transition-all"
          >
            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scan barcode or search product name, SKU, brand..."
              className="w-full bg-transparent text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1"
              >
                ×
              </button>
            )}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 ml-2">
              <Barcode className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-mono text-slate-400 font-medium hidden sm:inline">
                Enter to Add
              </span>
            </div>
          </form>

          {/* Quick Demo Barcode Trigger */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/70 text-[11px] font-semibold text-slate-600">
            <span className="px-2 text-slate-400 text-[10px] uppercase font-bold">Quick Scan:</span>
            <button
              onClick={() => {
                const coke = products.find(p => p.sku === 'CC750');
                if (coke) handleItemSelect(coke, 1);
              }}
              className="btn-press flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 rounded-xl shadow-2xs border border-slate-200/80 text-slate-800"
            >
              <img src="/products/coke.jpg" alt="Coke" className="w-4 h-4 rounded object-cover" />
              <span>Coke 750ml</span>
            </button>
            <button
              onClick={() => {
                const lays = products.find(p => p.sku === 'LAYS-BLU');
                if (lays) handleItemSelect(lays, 1);
              }}
              className="btn-press flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 rounded-xl shadow-2xs border border-slate-200/80 text-slate-800"
            >
              <img src="/products/lays.jpg" alt="Lays" className="w-4 h-4 rounded object-cover" />
              <span>Lay's Masala</span>
            </button>
          </div>
        </div>

        {/* Category Pills & Quick Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none select-none">
          <button
            onClick={() => {
              setShowOnlyFavorites(!showOnlyFavorites);
              if (!showOnlyFavorites) setSelectedCategory('All');
            }}
            className={`btn-press flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
              showOnlyFavorites
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-white text-white' : 'text-amber-500'}`} />
            <span>Fast Favorites</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setShowOnlyFavorites(false);
              }}
              className={`btn-press px-4 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                selectedCategory === cat && !showOnlyFavorites
                  ? 'bg-[#1e1e1e] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid with Real High-Resolution Photography */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
              <Package className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No products found</p>
              <p className="text-xs text-slate-400 mt-0.5">Try searching for a different keyword or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-6">
              {filteredProducts.map((product) => {
                const inCartItem = cart.items.find(i => i.productId === product.id);
                const isOutOfStock = product.trackInventory && product.currentStock <= 0;
                const isLowStock = product.trackInventory && product.currentStock <= product.minStock && product.currentStock > 0;

                return (
                  <button
                    key={product.id}
                    disabled={isOutOfStock}
                    onClick={() => handleItemSelect(product, 1)}
                    className={`btn-press group relative text-left bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 flex flex-col justify-between transition-all ${
                      isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'
                    } ${inCartItem ? 'ring-2 ring-[#1e1e1e]/80 border-transparent' : ''}`}
                  >
                    {/* Top row: Category tag & in-cart badge */}
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                        {product.category}
                      </span>
                      {inCartItem && (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#1e1e1e] text-white">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          {inCartItem.quantity}
                        </span>
                      )}
                    </div>

                    {/* Center: Real High-Resolution Photography */}
                    <div className="w-full flex flex-col items-center text-center my-1">
                      <div className="w-full h-28 rounded-xl bg-slate-50 overflow-hidden relative mb-2 flex items-center justify-center">
                        <ProductImage
                          src={product.image}
                          alt={product.name}
                          category={product.category}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {product.sku}
                      </span>
                    </div>

                    {/* Bottom: Price & Stock Status Badge */}
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="text-sm font-extrabold text-[#111827] font-mono">
                          ₹{product.sellingPrice}
                        </span>
                        {product.taxRate > 0 && (
                          <span className="text-[9px] text-slate-400 font-medium">
                            +{product.taxRate}% GST
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        {isOutOfStock ? (
                          <span className="text-[9.5px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                            Low: {product.currentStock}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Stock: {product.currentStock}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Right Side: Persistent Cart & Checkout Engine */}
      <CartPanel />

      {/* Customer Intake Gate Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="animate-spring-modal bg-white w-full max-w-md rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1e1e1e] text-white flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                    Customer Information
                  </h3>
                  <span className="text-[11px] font-medium text-slate-400">
                    Required before billing & maintained in internal directory
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStartBilling} className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Customer Mobile Number (10 Digits)
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10">
                  <Phone className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <input
                    autoFocus
                    type="tel"
                    placeholder="e.g. 98201 12345"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              {matchedExistingCustomer && (
                <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold">Recognized Customer:</span> {matchedExistingCustomer.name}
                    <div className="text-[10px] text-emerald-600 font-mono">
                      {matchedExistingCustomer.totalPurchases} Orders • {matchedExistingCustomer.loyaltyPoints} Loyalty Pts
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Customer Full Name
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10">
                  <User className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder={matchedExistingCustomer ? matchedExistingCustomer.name : "e.g. Rajesh Kumar"}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="btn-press flex-1 py-3 rounded-2xl bg-[#1e1e1e] hover:bg-black text-white text-xs font-bold shadow-brand flex items-center justify-center gap-2"
                >
                  <span>Start Billing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSkipCustomer}
                  className="btn-press px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  title="Fast bypass for anonymous cash counter"
                >
                  Walk-in / Skip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
