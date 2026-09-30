import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Search,
  CreditCard,
  LayoutDashboard,
  Package,
  Layers,
  Clock,
  RotateCcw,
  PlusCircle,
  Wifi,
  Database,
  X
} from 'lucide-react';
import { ProductImage } from '../../utils/imageHelper';

export function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setActiveView,
    setActiveModal,
    products,
    addToCart,
    isOnline,
    setIsOnline
  } = usePOS();

  const [query, setQuery] = useState('');

  // Global keydown listener for ⌘K or Ctrl+K or ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const quickActions = [
    {
      title: "Open Billing Counter",
      category: "Navigation",
      icon: CreditCard,
      action: () => { setActiveView('pos'); setIsCommandPaletteOpen(false); }
    },
    {
      title: "Executive Pulse Dashboard",
      category: "Navigation",
      icon: LayoutDashboard,
      action: () => { setActiveView('dashboard'); setIsCommandPaletteOpen(false); }
    },
    {
      title: "Stock & Inventory Ledger",
      category: "Navigation",
      icon: Layers,
      action: () => { setActiveView('inventory'); setIsCommandPaletteOpen(false); }
    },
    {
      title: "Record Drawer Pay-In / Pay-Out",
      category: "Shift & Cash Drawer",
      icon: Clock,
      action: () => { setActiveModal('cashMovement'); setIsCommandPaletteOpen(false); }
    },
    {
      title: "Close Shift & Cash Reconciliation",
      category: "Shift & Cash Drawer",
      icon: Clock,
      action: () => { setActiveModal('shiftClose'); setIsCommandPaletteOpen(false); }
    },
    {
      title: "Process Customer Refund / Return",
      category: "Sales",
      icon: RotateCcw,
      action: () => { setActiveModal('return'); setIsCommandPaletteOpen(false); }
    },
    {
      title: "Configure Supabase Cloud & Database Sync",
      category: "System",
      icon: Database,
      action: () => { setActiveModal('supabaseConfig'); setIsCommandPaletteOpen(false); }
    },
    {
      title: isOnline ? "Simulate Offline POS Mode" : "Switch to Online Cloud Sync",
      category: "System",
      icon: Wifi,
      action: () => { setIsOnline(!isOnline); setIsCommandPaletteOpen(false); }
    }
  ];

  // Filter actions or products
  const matchingActions = quickActions.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  const matchingProducts = query.trim() ? products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.sku.toLowerCase().includes(query.toLowerCase()) ||
    p.barcode.includes(query)
  ).slice(0, 5) : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4">
      <div className="animate-spring-modal bg-white w-full max-w-xl rounded-[24px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, action, product name or barcode..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm font-medium text-slate-900 placeholder-slate-400 bg-transparent outline-none"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 flex flex-col gap-1">
          {matchingProducts.length > 0 && (
            <div className="mb-2">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1 block">
                Products (Click to Add to Cart)
              </span>
              {matchingProducts.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => {
                    addToCart(prod, 1);
                    setActiveView('pos');
                    setIsCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 flex-shrink-0">
                      <ProductImage
                        src={prod.image}
                        alt={prod.name}
                        category={prod.category}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{prod.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">SKU: {prod.sku} | Barcode: {prod.barcode}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-extrabold font-mono text-slate-900">₹{prod.sellingPrice}</div>
                    <div className="text-[10px] font-semibold text-emerald-600">Stock: {prod.currentStock}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div>
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1 block">
              Commands & Quick Operations
            </span>
            {matchingActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={action.action}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-left transition-colors text-xs font-semibold text-slate-800"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{action.title}</span>
                  <span className="ml-auto text-[10.5px] font-medium text-slate-400">
                    {action.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with <kbd className="px-1.5 py-0.5 bg-white border rounded">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border rounded">↓</kbd></span>
          <span>Close with <kbd className="px-1.5 py-0.5 bg-white border rounded">Esc</kbd></span>
        </div>
      </div>
    </div>
  );
}
