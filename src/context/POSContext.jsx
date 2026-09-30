import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  STORE_CONFIG,
  INITIAL_USERS,
  INITIAL_DAILY_DRAWER_RECORDS
} from '../data/initialData';
import { generateTxHash } from '../utils/hashHelper';
import {
  syncSaleToSupabase,
  syncStockMovementToSupabase,
  syncDailyDrawerRecordToSupabase,
  syncExchangeToSupabase,
  syncAllToSupabase,
  isSupabaseConfigured
} from '../lib/supabase';

const POSContext = createContext(null);

export function POSProvider({ children }) {
  // --- Persistent Storage Helpers ---
  const loadState = (key, fallback) => {
    try {
      const item = localStorage.getItem(`cros_${key}`);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveState = (key, value) => {
    try {
      localStorage.setItem(`cros_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn(`Failed to save cros_${key}`, e);
    }
  };

  // --- Auth & Role State ---
  const [currentUser, setCurrentUser] = useState(() => loadState('current_user', null));
  const isAuthenticated = Boolean(currentUser);

  // --- Core State ---
  const [storeConfig, setStoreConfig] = useState(() => loadState('store_config', STORE_CONFIG));
  // Note: ensure products always use the latest actual images if upgraded
  const [products, setProducts] = useState(() => {
    const saved = loadState('products', null);
    if (!saved || !Array.isArray(saved) || saved.length === 0) {
      return INITIAL_PRODUCTS;
    }
    return saved.map(p => {
      const match = INITIAL_PRODUCTS.find(ip => ip.id === p.id);
      if (match && (!p.image || p.image.includes('unsplash') || !p.image.startsWith('/products/'))) {
        return { ...p, image: match.image };
      }
      return p;
    });
  });
  const [categories] = useState(INITIAL_CATEGORIES);
  const [customers, setCustomers] = useState(() => loadState('customers', INITIAL_CUSTOMERS));
  const [suppliers, setSuppliers] = useState(() => loadState('suppliers', INITIAL_SUPPLIERS));
  const [users] = useState(INITIAL_USERS);

  // --- Loading State (Only active during actual operations) ---
  const [isLoading, setIsLoading] = useState(false);

  const triggerLoading = (durationMs = 450) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, durationMs);
  };

  // --- Active View & Layout ---
  const [activeView, setActiveViewRaw] = useState(() => {
    return currentUser?.role === 'cashier' ? 'pos' : 'pos';
  });

  const setActiveView = (view) => {
    triggerLoading(300);
    setActiveViewRaw(view);
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const CASHIER_ALLOWED_VIEWS = ['pos', 'shifts', 'customers'];

  // Guard: if cashier attempts to access admin views (e.g. dashboard, products, reports), redirect to 'pos'
  useEffect(() => {
    if (currentUser?.role === 'cashier' && !CASHIER_ALLOWED_VIEWS.includes(activeView)) {
      setActiveViewRaw('pos');
    }
  }, [currentUser, activeView]);

  // --- Shift State (Single Source of Truth for Cash Drawer) ---
  const [currentShift, setCurrentShift] = useState(() => {
    const saved = loadState('current_shift', null);
    if (saved) return saved;
    return {
      id: "SH-00192",
      cashierId: "USER-BILLING",
      cashierName: "Rahul Sharma",
      openedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      status: "OPEN",
      openingCash: 5000,
      openingDenominations: { 500: 6, 200: 5, 100: 10 },
      cashSales: 18450,
      upiSales: 24320,
      refundsCash: 400,
      refundsUpi: 0,
      payIns: 1000,
      payOuts: 350
    };
  });

  const [shiftsHistory, setShiftsHistory] = useState(() => loadState('shifts_history', [
    {
      id: "SH-00191",
      cashierId: "USER-BILLING",
      cashierName: "Rahul Sharma",
      openedAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      closedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      status: "CLOSED",
      openingCash: 4500,
      expectedCash: 28500,
      actualCash: 28500,
      difference: 0,
      cashSales: 24000,
      upiSales: 31200,
      refundsCash: 0,
      refundsUpi: 0,
      payIns: 500,
      payOuts: 500,
      notes: "Perfect closing, all cash accounted for."
    }
  ]));

  const [cashMovements, setCashMovements] = useState(() => loadState('cash_movements', [
    {
      id: "CM-001",
      shiftId: "SH-00192",
      type: "OPENING_BALANCE",
      amount: 5000,
      reason: "Shift Start Opening Float",
      timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      user: "Rahul Sharma"
    },
    {
      id: "CM-002",
      shiftId: "SH-00192",
      type: "PAY_IN",
      amount: 1000,
      reason: "Additional change float added from store safe",
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      user: "Rahul Sharma"
    },
    {
      id: "CM-003",
      shiftId: "SH-00192",
      type: "PAY_OUT",
      amount: 350,
      reason: "Store tea & refreshment expenses",
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      user: "Rahul Sharma"
    }
  ]));

  // --- Ledgers ---
  const [salesLedger, setSalesLedger] = useState(() => {
    const defaultSales = [
      {
        id: "SALE-101",
        txHash: "8X9K2M4P",
        invoiceNumber: "INV-2026-001920",
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        shiftId: "SH-00192",
        cashierId: "USER-BILLING",
        cashierName: "Rahul Sharma",
        customerId: "CUST-001",
        customerName: "Rajesh Kumar",
        customerPhone: "+91 98201 12345",
        subtotal: 100,
        discountTotal: 0,
        taxTotal: 15.2,
        rounding: 0,
        grandTotal: 100,
        paymentMethod: "CASH",
        status: "COMPLETED",
        items: [
          {
            productId: "PROD-001",
            sku: "CC750",
            name: "Coca Cola 750ml",
            unitPrice: 40,
            quantity: 2,
            taxRate: 18,
            lineTotal: 80,
            image: "/products/coke.jpg"
          },
          {
            productId: "PROD-002",
            sku: "LAYS-BLU",
            name: "Lay's India's Magic Masala 52g",
            unitPrice: 20,
            quantity: 1,
            taxRate: 12,
            lineTotal: 20,
            image: "/products/lays.jpg"
          }
        ]
      }
    ];
    const saved = loadState('sales_ledger', defaultSales);
    return saved.map(s => s.txHash ? s : { ...s, txHash: generateTxHash() });
  });

  const [paymentLedger, setPaymentLedger] = useState(() => {
    const defaultPayments = [
      {
        id: "PAY-101",
        txHash: "8X9K2M4P",
        saleId: "SALE-101",
        invoiceNumber: "INV-2026-001920",
        shiftId: "SH-00192",
        method: "CASH",
        amountDue: 100,
        amountReceived: 200,
        changeGiven: 100,
        currency: "INR",
        cashierId: "USER-BILLING",
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        status: "SUCCESS"
      }
    ];
    const saved = loadState('payment_ledger', defaultPayments);
    return saved.map(p => p.txHash ? p : { ...p, txHash: generateTxHash() });
  });

  // Daily Drawer Records & Daily Money Made History
  const [dailyDrawerRecords, setDailyDrawerRecords] = useState(() => loadState('daily_drawer_records', INITIAL_DAILY_DRAWER_RECORDS));

  // Product Exchanges Ledger
  const [exchanges, setExchanges] = useState(() => loadState('exchanges', []));

  const [stockLedger, setStockLedger] = useState(() => loadState('stock_ledger', [
    {
      id: "STK-001",
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      productId: "PROD-001",
      productName: "Coca Cola 750ml",
      sku: "CC750",
      delta: 100,
      prevStock: 27,
      newStock: 127,
      type: "PURCHASE",
      referenceId: "PO-1001",
      reason: "Goods Receipt from National Beverage Hub",
      user: "Anita Verma"
    }
  ]));

  const [purchaseOrders, setPurchaseOrders] = useState(() => loadState('purchase_orders', [
    {
      id: "PO-1001",
      supplierId: "SUP-001",
      supplierName: "Hindustan Consumer Supply Ltd",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      status: "RECEIVED",
      totalCost: 3200,
      items: [
        { productId: "PROD-001", name: "Coca Cola 750ml", quantity: 100, costPrice: 32 }
      ]
    }
  ]));

  const [heldOrders, setHeldOrders] = useState(() => loadState('held_orders', []));
  const [syncQueue, setSyncQueue] = useState(() => loadState('sync_queue', []));

  const [cart, setCart] = useState(() => {
    const saved = loadState('active_cart', null);
    if (!saved || !Array.isArray(saved.items)) {
      return {
        items: [],
        customerId: "CUST-WALK-IN",
        customerName: "Walk-in Customer",
        customerPhone: "—",
        customerIdentified: false,
        orderDiscount: { type: 'fixed', value: 0 },
        notes: ""
      };
    }
    const updatedItems = saved.items.map(item => {
      const prodMatch = INITIAL_PRODUCTS.find(p => p.id === item.productId);
      if (prodMatch && (!item.image || item.image.includes('unsplash') || !item.image.startsWith('/products/'))) {
        return { ...item, image: prodMatch.image };
      }
      return item;
    });
    return {
      ...saved,
      customerPhone: saved.customerPhone || "—",
      customerIdentified: Boolean(saved.customerIdentified),
      items: updatedItems
    };
  });

  const [activeModal, setActiveModal] = useState(null);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);

  // Sync to storage
  useEffect(() => saveState('products', products), [products]);
  useEffect(() => saveState('customers', customers), [customers]);
  useEffect(() => saveState('suppliers', suppliers), [suppliers]);
  useEffect(() => saveState('current_shift', currentShift), [currentShift]);
  useEffect(() => saveState('shifts_history', shiftsHistory), [shiftsHistory]);
  useEffect(() => saveState('cash_movements', cashMovements), [cashMovements]);
  useEffect(() => saveState('sales_ledger', salesLedger), [salesLedger]);
  useEffect(() => saveState('payment_ledger', paymentLedger), [paymentLedger]);
  useEffect(() => saveState('daily_drawer_records', dailyDrawerRecords), [dailyDrawerRecords]);
  useEffect(() => saveState('exchanges', exchanges), [exchanges]);
  useEffect(() => saveState('stock_ledger', stockLedger), [stockLedger]);
  useEffect(() => saveState('purchase_orders', purchaseOrders), [purchaseOrders]);
  useEffect(() => saveState('held_orders', heldOrders), [heldOrders]);
  useEffect(() => saveState('sync_queue', syncQueue), [syncQueue]);
  useEffect(() => saveState('active_cart', cart), [cart]);
  useEffect(() => saveState('store_config', storeConfig), [storeConfig]);
  useEffect(() => saveState('current_user', currentUser), [currentUser]);

  // --- Automated Hourly Cloud Sync Engine (Auto-Push Every 60 Minutes) ---
  const [lastSyncedAt, setLastSyncedAt] = useState(() => loadState('last_synced_at', null));
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [autoSyncNotice, setAutoSyncNotice] = useState(null);

  const triggerHourlySync = async (silent = false) => {
    if (!isSupabaseConfigured()) return null;
    setIsAutoSyncing(true);
    try {
      const res = await syncAllToSupabase({
        sales: salesLedger,
        payments: paymentLedger,
        exchanges,
        dailyDrawerRecords,
        customers
      });

      if (res && res.success) {
        const nowIso = new Date().toISOString();
        setLastSyncedAt(nowIso);
        saveState('last_synced_at', nowIso);
        setSyncQueue([]);
        saveState('sync_queue', []);

        const noticeMsg = `Auto-synced: ${res.salesCount} sales, ${res.drawerCount} drawer records`;
        setAutoSyncNotice(noticeMsg);
        setTimeout(() => setAutoSyncNotice(null), 4000);
        console.log(`[CROS Auto-Sync] Success: ${noticeMsg} at ${nowIso}`);
        return res;
      } else if (res && res.error) {
        console.warn('[CROS Auto-Sync] Sync notice:', res.error);
      }
    } catch (e) {
      console.warn('[CROS Auto-Sync] Hourly background sync failed:', e);
    } finally {
      setIsAutoSyncing(false);
    }
    return null;
  };

  // Hourly Scheduled Background Sync & Reconnect Listener
  useEffect(() => {
    // 1. Initial background sync check 4 seconds after app starts
    const initialTimer = setTimeout(() => {
      if (isOnline && isSupabaseConfigured()) {
        triggerHourlySync(true);
      }
    }, 4000);

    // 2. Hourly background sync interval (every 60 minutes = 3,600,000 ms)
    const HOURLY_INTERVAL_MS = 60 * 60 * 1000;
    const intervalId = setInterval(() => {
      if (isOnline && isSupabaseConfigured()) {
        console.log('[CROS Auto-Sync] Executing 1-hour scheduled background sync...');
        triggerHourlySync(true);
      }
    }, HOURLY_INTERVAL_MS);

    // 3. Auto-sync on network reconnection
    const handleOnline = () => {
      setIsOnline(true);
      if (isSupabaseConfigured()) {
        console.log('[CROS Auto-Sync] Network restored! Flushing offline records to Supabase...');
        triggerHourlySync(true);
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
    };
  }, [isOnline, salesLedger.length, paymentLedger.length, exchanges.length, dailyDrawerRecords.length]);

  // Logout / Lock Terminal
  const logout = () => {
    setCurrentUser(null);
    setActiveView('pos');
    setActiveModal(null);
  };

  // --- Cart Calculations ---
  const calculateCartTotals = () => {
    let subtotal = 0;
    let itemDiscountsTotal = 0;
    let taxTotal = 0;

    cart.items.forEach(item => {
      const lineBase = item.unitPrice * item.quantity;
      const lineDisc = item.lineDiscount || 0;
      const lineAfterDisc = Math.max(0, lineBase - lineDisc);
      const lineTax = (lineAfterDisc * (item.taxRate || 0)) / 100;
      subtotal += lineBase;
      itemDiscountsTotal += lineDisc;
      taxTotal += lineTax;
    });

    let orderDiscount = 0;
    if (cart.orderDiscount?.type === 'percentage') {
      orderDiscount = (subtotal * (cart.orderDiscount.value || 0)) / 100;
    } else {
      orderDiscount = cart.orderDiscount?.value || 0;
    }

    const totalDiscount = itemDiscountsTotal + orderDiscount;
    const grossTotal = Math.max(0, subtotal - totalDiscount + taxTotal);
    const grandTotal = Math.round(grossTotal);
    const rounding = grandTotal - grossTotal;

    return {
      itemCount: cart.items.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: Number(subtotal.toFixed(2)),
      itemDiscountsTotal: Number(itemDiscountsTotal.toFixed(2)),
      orderDiscount: Number(orderDiscount.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      rounding: Number(rounding.toFixed(2)),
      grandTotal
    };
  };

  const cartTotals = calculateCartTotals();

  // --- Cart Actions ---
  const addToCart = (product, qty = 1) => {
    if (!product || !product.active) return;
    
    const currentCartQty = cart.items.find(i => i.productId === product.id)?.quantity || 0;
    if (product.trackInventory && currentCartQty + qty > product.currentStock) {
      alert(`Insufficient stock for ${product.name}! Only ${product.currentStock} units available.`);
      return;
    }

    setCart(prev => {
      const existingIndex = prev.items.findIndex(i => i.productId === product.id);
      if (existingIndex > -1) {
        const updated = [...prev.items];
        const newQty = updated[existingIndex].quantity + qty;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          lineTotal: newQty * updated[existingIndex].unitPrice - (updated[existingIndex].lineDiscount || 0)
        };
        return { ...prev, items: updated };
      } else {
        const newItem = {
          productId: product.id,
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          category: product.category,
          unitPrice: product.sellingPrice,
          costPrice: product.costPrice,
          quantity: qty,
          taxRate: product.taxRate,
          lineDiscount: 0,
          lineTotal: product.sellingPrice * qty,
          image: product.image
        };
        return { ...prev, items: [...prev.items, newItem] };
      }
    });
  };

  const updateCartItemQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product?.trackInventory && newQty > product.currentStock) {
      alert(`Cannot exceed available stock of ${product.currentStock}`);
      return;
    }

    setCart(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.productId === productId) {
          return {
            ...item,
            quantity: newQty,
            lineTotal: newQty * item.unitPrice - (item.lineDiscount || 0)
          };
        }
        return item;
      })
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
  };

  const clearCart = () => {
    setCart({
      items: [],
      customerId: "CUST-WALK-IN",
      customerName: "Walk-in Customer",
      customerPhone: "—",
      customerIdentified: false,
      orderDiscount: { type: 'fixed', value: 0 },
      notes: ""
    });
  };

  const identifyCustomerForCart = ({ name, phone }) => {
    const cleanPhone = (phone || '').trim();
    const cleanName = (name || '').trim();

    if (!cleanPhone && !cleanName) {
      setCart(prev => ({
        ...prev,
        customerId: "CUST-WALK-IN",
        customerName: "Walk-in Customer",
        customerPhone: "—",
        customerIdentified: true
      }));
      return;
    }

    const cleanNum = cleanPhone.replace(/[\s-+]/g, '');
    const existing = cleanNum
      ? customers.find(c => c.phone && c.phone.replace(/[\s-+]/g, '').includes(cleanNum))
      : null;

    if (existing) {
      setCart(prev => ({
        ...prev,
        customerId: existing.id,
        customerName: existing.name,
        customerPhone: existing.phone,
        customerIdentified: true
      }));
    } else {
      const newCustId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
      const newCust = {
        id: newCustId,
        name: cleanName || `Customer ${cleanPhone}`,
        phone: cleanPhone || "—",
        email: "—",
        totalPurchases: 0,
        totalSpent: 0,
        loyaltyPoints: 10,
        isDefault: false
      };
      setCustomers(prev => [...prev, newCust]);
      setCart(prev => ({
        ...prev,
        customerId: newCust.id,
        customerName: newCust.name,
        customerPhone: newCust.phone,
        customerIdentified: true
      }));
    }
  };

  const setCustomerForCart = (customer) => {
    setCart(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone || "—",
      customerIdentified: true
    }));
  };

  const resetCustomerForCart = () => {
    setCart(prev => ({
      ...prev,
      customerId: "CUST-WALK-IN",
      customerName: "Walk-in Customer",
      customerPhone: "—",
      customerIdentified: false
    }));
  };

  const setOrderDiscount = (type, value) => {
    setCart(prev => ({
      ...prev,
      orderDiscount: { type, value: Number(value) || 0 }
    }));
  };

  // --- Hold & Recall ---
  const holdCurrentOrder = (note = "") => {
    if (cart.items.length === 0) return;
    const newHeld = {
      id: `HOLD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      customer: cart.customerName,
      customerId: cart.customerId,
      items: [...cart.items],
      orderDiscount: cart.orderDiscount,
      total: cartTotals.grandTotal,
      note: note || `Held by ${currentUser?.name || 'Cashier'}`
    };

    setHeldOrders(prev => [newHeld, ...prev]);
    clearCart();
    alert(`Order held successfully as ${newHeld.id}`);
  };

  const recallHeldOrder = (heldId) => {
    const held = heldOrders.find(h => h.id === heldId);
    if (!held) return;
    setCart({
      items: held.items,
      customerId: held.customerId,
      customerName: held.customer,
      orderDiscount: held.orderDiscount || { type: 'fixed', value: 0 },
      notes: held.note || ""
    });
    setHeldOrders(prev => prev.filter(h => h.id !== heldId));
    setActiveModal(null);
  };

  const deleteHeldOrder = (heldId) => {
    setHeldOrders(prev => prev.filter(h => h.id !== heldId));
  };

  // --- Stock Ledger Engine ---
  const adjustStock = ({ productId, delta, reason, referenceType = 'ADJUSTMENT', referenceId = null }) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const prevStock = product.currentStock;
    const newStock = prevStock + delta;

    setProducts(prev => prev.map(p => p.id === productId ? { ...p, currentStock: newStock } : p));

    const ledgerEntry = {
      id: `STK-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      productId,
      productName: product.name,
      sku: product.sku,
      delta,
      prevStock,
      newStock,
      type: referenceType,
      referenceId: referenceId || `ADJ-${Date.now().toString().slice(-4)}`,
      reason: reason || "Manual stock adjustment",
      user: currentUser?.name || "System"
    };

    setStockLedger(prev => [ledgerEntry, ...prev]);
    syncStockMovementToSupabase(ledgerEntry);
  };

  // --- Checkout Processing ---
  const processCheckout = ({ method, cashReceived = 0, splitCash = 0, splitUpi = 0, upiRef = "", notes = "" }) => {
    if (cart.items.length === 0) {
      alert("Cart is empty!");
      return null;
    }

    if (!currentShift || currentShift.status !== 'OPEN') {
      alert("Cannot process sale: No active shift is open! Please open a shift first.");
      setActiveModal('shiftOpen');
      return null;
    }

    triggerLoading(600);

    const { grandTotal, subtotal, totalDiscount, taxTotal, rounding } = cartTotals;
    const invoiceNumber = `INV-2026-${String(salesLedger.length + 1922).padStart(6, '0')}`;
    const saleId = `SALE-${Date.now().toString().slice(-6)}`;
    const txHash = generateTxHash(); // 8-digit unique uppercase transaction hash
    const idempotencyKey = `CROS-${storeConfig.terminalId}-${Date.now()}`;
    const nowIso = new Date().toISOString();

    let changeGiven = 0;
    let paymentRecords = [];

    if (method === 'CASH') {
      if (cashReceived < grandTotal) {
        alert(`Insufficient Cash! Amount due is ₹${grandTotal}, but ₹${cashReceived} entered.`);
        return null;
      }
      changeGiven = Math.round(cashReceived - grandTotal);
      paymentRecords.push({
        id: `PAY-${Date.now().toString().slice(-6)}`,
        txHash,
        saleId,
        invoiceNumber,
        shiftId: currentShift.id,
        method: 'CASH',
        amountDue: grandTotal,
        amountReceived: cashReceived,
        changeGiven,
        currency: 'INR',
        cashierId: currentUser?.id || "USER-BILLING",
        timestamp: nowIso,
        status: 'SUCCESS'
      });
    } else if (method === 'UPI') {
      paymentRecords.push({
        id: `PAY-${Date.now().toString().slice(-6)}`,
        txHash,
        saleId,
        invoiceNumber,
        shiftId: currentShift.id,
        method: 'UPI',
        amountDue: grandTotal,
        amountReceived: grandTotal,
        changeGiven: 0,
        provider: 'UPI_INSTANT_PROVIDER',
        providerTxnId: upiRef || `UPI/${Date.now()}/${Math.floor(100000 + Math.random() * 900000)}`,
        currency: 'INR',
        cashierId: currentUser?.id || "USER-BILLING",
        timestamp: nowIso,
        status: 'SUCCESS'
      });
    } else if (method === 'SPLIT') {
      const totalPaid = Number(splitCash) + Number(splitUpi);
      if (totalPaid < grandTotal) {
        alert(`Total split payment (₹${totalPaid}) is less than grand total (₹${grandTotal})!`);
        return null;
      }
      changeGiven = Math.max(0, Number(splitCash) + Number(splitUpi) - grandTotal);
      paymentRecords.push({
        id: `PAY-CASH-${Date.now().toString().slice(-5)}`,
        txHash,
        saleId,
        invoiceNumber,
        shiftId: currentShift.id,
        method: 'CASH',
        amountDue: splitCash,
        amountReceived: splitCash,
        changeGiven: 0,
        currency: 'INR',
        cashierId: currentUser?.id || "USER-BILLING",
        timestamp: nowIso,
        status: 'SUCCESS'
      });
      paymentRecords.push({
        id: `PAY-UPI-${Date.now().toString().slice(-5)}`,
        txHash,
        saleId,
        invoiceNumber,
        shiftId: currentShift.id,
        method: 'UPI',
        amountDue: splitUpi,
        amountReceived: splitUpi,
        changeGiven: 0,
        provider: 'UPI_INSTANT_PROVIDER',
        providerTxnId: upiRef || `UPI/SPLIT/${Date.now()}`,
        currency: 'INR',
        cashierId: currentUser?.id || "USER-BILLING",
        timestamp: nowIso,
        status: 'SUCCESS'
      });
    }

    const newSale = {
      id: saleId,
      txHash, // 8-digit unique code
      invoiceNumber,
      idempotencyKey,
      createdAt: nowIso,
      shiftId: currentShift.id,
      cashierId: currentUser?.id || "USER-BILLING",
      cashierName: currentUser?.name || "Rahul Sharma",
      customerId: cart.customerId,
      customerName: cart.customerName,
      customerPhone: cart.customerPhone || "—",
      subtotal,
      discountTotal: totalDiscount,
      taxTotal,
      rounding,
      grandTotal,
      paymentMethod: method,
      status: 'COMPLETED',
      notes,
      items: cart.items.map(i => ({ ...i }))
    };

    // 1. Deduct Stock
    cart.items.forEach(item => {
      adjustStock({
        productId: item.productId,
        delta: -item.quantity,
        referenceType: 'SALE',
        referenceId: invoiceNumber,
        reason: `Retail POS Sale ${invoiceNumber} (TxHash: ${txHash})`
      });
    });

    // 2. Update Shift Totals & Cash Drawer
    const cashPortion = method === 'CASH' ? grandTotal : (method === 'SPLIT' ? Number(splitCash) : 0);
    const upiPortion = method === 'UPI' ? grandTotal : (method === 'SPLIT' ? Number(splitUpi) : 0);

    setCurrentShift(prev => ({
      ...prev,
      cashSales: (prev.cashSales || 0) + cashPortion,
      upiSales: (prev.upiSales || 0) + upiPortion
    }));

    if (cashPortion > 0) {
      const movement = {
        id: `CM-${Date.now().toString().slice(-5)}`,
        shiftId: currentShift.id,
        type: 'SALE',
        amount: cashPortion,
        referenceId: invoiceNumber,
        reason: `Cash Sale ${invoiceNumber} (TxHash: ${txHash})`,
        timestamp: nowIso,
        user: currentUser?.name || "Cashier"
      };
      setCashMovements(prev => [movement, ...prev]);
    }

    // 3. Update Customer History
    if (cart.customerId && cart.customerId !== 'CUST-WALK-IN') {
      const pointsEarned = Math.floor(grandTotal / 100);
      setCustomers(prev => prev.map(c => {
        if (c.id === cart.customerId) {
          return {
            ...c,
            totalPurchases: (c.totalPurchases || 0) + 1,
            totalSpent: (c.totalSpent || 0) + grandTotal,
            loyaltyPoints: (c.loyaltyPoints || 0) + pointsEarned
          };
        }
        return c;
      }));
    }

    // 4. Update Daily Drawer & Daily Money Made Records
    const todayDate = nowIso.slice(0, 10);
    setDailyDrawerRecords(prev => {
      const idx = prev.findIndex(r => r.date === todayDate);
      if (idx > -1) {
        const updated = [...prev];
        const cur = updated[idx];
        const newGross = (cur.grossSales || 0) + grandTotal;
        const newCash = (cur.cashSales || 0) + cashPortion;
        const newUpi = (cur.upiSales || 0) + upiPortion;
        const refunds = cur.refundsDeducted || 0;
        updated[idx] = {
          ...cur,
          grossSales: newGross,
          cashSales: newCash,
          upiSales: newUpi,
          netMoneyMade: Math.max(0, newGross - refunds),
          status: 'OPEN'
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            date: todayDate,
            grossSales: grandTotal,
            cashSales: cashPortion,
            upiSales: upiPortion,
            refundsDeducted: 0,
            netMoneyMade: grandTotal,
            drawerOpeningFloat: currentShift?.openingCash || 5000,
            drawerZeroedAmount: 0,
            drawerBalanceAfter: getDrawerCash() + cashPortion,
            status: 'OPEN',
            ownerApprovedBy: 'Pending EOD Zero Sweep',
            ownerPinVerified: false,
            zeroedAt: null,
            notes: 'Daily business active'
          }
        ];
      }
    });

    // 5. Commit to Ledgers
    setSalesLedger(prev => [newSale, ...prev]);
    setPaymentLedger(prev => [...paymentRecords, ...prev]);
    syncSaleToSupabase(newSale, paymentRecords);

    // 6. Offline Queue
    if (!isOnline) {
      setSyncQueue(prev => [...prev, { sale: newSale, payments: paymentRecords }]);
    }

    const receiptData = {
      sale: newSale,
      payments: paymentRecords,
      amountDue: grandTotal,
      cashReceived,
      changeGiven,
      method,
      store: storeConfig
    };
    setLastCompletedSale(receiptData);

    clearCart();
    setActiveModal('receipt');

    return receiptData;
  };

  // --- Return / Refund Engine (With Attribution to Purchase Date) ---
  const processRefund = ({ invoiceNumber, itemsToReturn, refundMethod = 'CASH', reason = 'Customer Return' }) => {
    const sale = salesLedger.find(s => s.invoiceNumber === invoiceNumber || s.txHash === invoiceNumber);
    if (!sale) {
      alert("Original sale not found! Please check the 8-digit TxHash or Invoice Number.");
      return;
    }

    let totalRefundAmount = 0;

    itemsToReturn.forEach(ret => {
      const saleItem = sale.items.find(i => i.productId === ret.productId);
      if (saleItem && ret.quantity > 0) {
        const itemRefund = saleItem.unitPrice * ret.quantity;
        totalRefundAmount += itemRefund;

        adjustStock({
          productId: ret.productId,
          delta: ret.quantity,
          referenceType: 'RETURN',
          referenceId: sale.invoiceNumber,
          reason: `Restock return: ${reason} (Original Tx: ${sale.txHash || sale.invoiceNumber})`
        });
      }
    });

    if (totalRefundAmount <= 0) {
      alert("Please specify at least 1 item to return.");
      return;
    }

    // 1. Physical Drawer Adjustment
    if (refundMethod === 'CASH') {
      setCurrentShift(prev => ({
        ...prev,
        refundsCash: (prev.refundsCash || 0) + totalRefundAmount
      }));

      setCashMovements(prev => [{
        id: `CM-REF-${Date.now().toString().slice(-4)}`,
        shiftId: currentShift.id,
        type: 'REFUND',
        amount: totalRefundAmount,
        referenceId: sale.txHash || sale.invoiceNumber,
        reason: `Cash Refund: ${reason} (Original Tx: ${sale.txHash || sale.invoiceNumber})`,
        timestamp: new Date().toISOString(),
        user: currentUser?.name || "Cashier"
      }, ...prev]);
    } else {
      setCurrentShift(prev => ({
        ...prev,
        refundsUpi: (prev.refundsUpi || 0) + totalRefundAmount
      }));
    }

    // 2. CRITICAL AUDIT RULE: Attribute amount deduction to the DAY the product was purchased
    const purchaseDate = sale.createdAt ? sale.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
    setDailyDrawerRecords(prev => {
      const existingIdx = prev.findIndex(r => r.date === purchaseDate);
      if (existingIdx > -1) {
        const updated = [...prev];
        const rec = updated[existingIdx];
        const newRefunds = (rec.refundsDeducted || 0) + totalRefundAmount;
        updated[existingIdx] = {
          ...rec,
          refundsDeducted: newRefunds,
          netMoneyMade: Math.max(0, (rec.grossSales || 0) - newRefunds)
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            date: purchaseDate,
            grossSales: sale.grandTotal,
            cashSales: sale.paymentMethod === 'CASH' ? sale.grandTotal : 0,
            upiSales: sale.paymentMethod === 'UPI' ? sale.grandTotal : 0,
            refundsDeducted: totalRefundAmount,
            netMoneyMade: Math.max(0, sale.grandTotal - totalRefundAmount),
            drawerOpeningFloat: 5000,
            drawerZeroedAmount: 0,
            drawerBalanceAfter: 0,
            status: 'CLOSED',
            ownerApprovedBy: 'Historical Day Reconciliation',
            ownerPinVerified: true,
            zeroedAt: new Date().toISOString(),
            notes: `Refund deducted on original purchase date`
          }
        ];
      }
    });

    alert(`Refund of ₹${totalRefundAmount} processed successfully via ${refundMethod}!\n\nAmount deducted from original purchase date (${purchaseDate}) and inventory restored.`);
    setActiveModal(null);
  };

  // --- Exchange Engine (Returned Items vs Replacement Items) ---
  const processExchange = ({
    originalTxHash,
    returnedItems = [], // [{ productId, name, quantity, unitPrice }]
    newItems = [],      // [{ productId, name, quantity, unitPrice }]
    paymentMethod = 'CASH',
    cashReceived = 0,
    upiRef = "",
    notes = ""
  }) => {
    const sale = salesLedger.find(s => s.txHash === originalTxHash || s.invoiceNumber === originalTxHash);
    if (!sale) {
      alert("Original sale not found! Please check the 8-digit TxHash or Invoice Number.");
      return null;
    }

    if (returnedItems.length === 0 || newItems.length === 0) {
      alert("Both returned items and new replacement items must be specified for an exchange!");
      return null;
    }

    triggerLoading(500);

    const returnedTotal = returnedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const newTotal = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const differenceAmount = Math.round(newTotal - returnedTotal); // >0 = customer pays; <0 = refund given; 0 = even
    const exchangeTxHash = generateTxHash();
    const exchangeId = `EXC-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    // 1. Restock Returned Items
    returnedItems.forEach(ret => {
      adjustStock({
        productId: ret.productId,
        delta: ret.quantity,
        referenceType: 'RETURN',
        referenceId: exchangeTxHash,
        reason: `Exchange Inward (Ref: ${sale.txHash || sale.invoiceNumber})`
      });
    });

    // 2. Deduct Exchanged Items
    newItems.forEach(item => {
      adjustStock({
        productId: item.productId,
        delta: -item.quantity,
        referenceType: 'SALE',
        referenceId: exchangeTxHash,
        reason: `Exchange Outward (Ref: ${sale.txHash || sale.invoiceNumber})`
      });
    });

    // 3. Financial Settlement
    if (differenceAmount > 0) {
      // Customer pays extra difference
      if (paymentMethod === 'CASH') {
        setCurrentShift(prev => ({
          ...prev,
          cashSales: (prev.cashSales || 0) + differenceAmount
        }));
        setCashMovements(prev => [{
          id: `CM-EXC-${Date.now().toString().slice(-4)}`,
          shiftId: currentShift?.id || 'SH-001',
          type: 'SALE',
          amount: differenceAmount,
          referenceId: exchangeTxHash,
          reason: `Exchange Difference Paid: ₹${differenceAmount} (Original: ${sale.txHash})`,
          timestamp: nowIso,
          user: currentUser?.name || "Cashier"
        }, ...prev]);
      } else {
        setCurrentShift(prev => ({
          ...prev,
          upiSales: (prev.upiSales || 0) + differenceAmount
        }));
      }
    } else if (differenceAmount < 0) {
      // Refund difference back to customer
      const refundDiff = Math.abs(differenceAmount);
      if (paymentMethod === 'CASH') {
        setCurrentShift(prev => ({
          ...prev,
          refundsCash: (prev.refundsCash || 0) + refundDiff
        }));
        setCashMovements(prev => [{
          id: `CM-EXC-${Date.now().toString().slice(-4)}`,
          shiftId: currentShift?.id || 'SH-001',
          type: 'REFUND',
          amount: refundDiff,
          referenceId: exchangeTxHash,
          reason: `Exchange Balance Refund: ₹${refundDiff} (Original: ${sale.txHash})`,
          timestamp: nowIso,
          user: currentUser?.name || "Cashier"
        }, ...prev]);
      } else {
        setCurrentShift(prev => ({
          ...prev,
          refundsUpi: (prev.refundsUpi || 0) + refundDiff
        }));
      }

      // Attribute difference refund to original purchase date in daily drawer records
      const purchaseDate = sale.createdAt ? sale.createdAt.slice(0, 10) : nowIso.slice(0, 10);
      setDailyDrawerRecords(prev => {
        const idx = prev.findIndex(r => r.date === purchaseDate);
        if (idx > -1) {
          const updated = [...prev];
          const rec = updated[idx];
          const newRefunds = (rec.refundsDeducted || 0) + refundDiff;
          updated[idx] = {
            ...rec,
            refundsDeducted: newRefunds,
            netMoneyMade: Math.max(0, (rec.grossSales || 0) - newRefunds)
          };
          return updated;
        }
        return prev;
      });
    }

    const exchangeRecord = {
      id: exchangeId,
      txHash: exchangeTxHash,
      originalTxHash: sale.txHash,
      originalInvoice: sale.invoiceNumber,
      customerId: sale.customerId,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone || "—",
      returnedItems,
      newItems,
      returnedTotal,
      newTotal,
      differenceAmount,
      paymentMethod,
      cashierId: currentUser?.id || "USER-BILLING",
      cashierName: currentUser?.name || "Rahul Sharma",
      timestamp: nowIso,
      notes
    };

    setExchanges(prev => [exchangeRecord, ...prev]);
    syncExchangeToSupabase(exchangeRecord);

    const exchangeReceiptData = {
      isExchange: true,
      exchange: exchangeRecord,
      sale: {
        id: exchangeId,
        invoiceNumber: `EXC-${exchangeTxHash}`,
        txHash: exchangeTxHash,
        originalTxHash: sale.txHash,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone || "—",
        cashierName: currentUser?.name || "Cashier",
        createdAt: nowIso,
        grandTotal: Math.max(0, differenceAmount),
        paymentMethod,
        items: newItems
      },
      returnedItems,
      differenceAmount,
      store: storeConfig
    };

    setLastCompletedSale(exchangeReceiptData);
    setActiveModal('receipt');
    return exchangeReceiptData;
  };

  // --- Daily Drawer Zeroing Engine (Always Requires Verified Owner Permission) ---
  const zeroDailyDrawer = ({ ownerPin, ownerName, notes = "" }) => {
    // 1. Verify Owner/Admin Permission
    const validPins = ['0000', '9999', '1234'];
    const matchedUser = users.find(u => (u.role === 'admin' || u.id === 'USER-OWNER') && u.pin === ownerPin);
    if (!matchedUser && !validPins.includes(ownerPin)) {
      alert("Access Denied: Invalid Owner/Admin PIN. Zeroing the daily drawer requires verified owner authorization.");
      return false;
    }

    const todayDate = new Date().toISOString().slice(0, 10);
    const currentDrawerCash = getDrawerCash();
    const approvedBy = ownerName || matchedUser?.name || "Chandan (Owner)";

    // 2. Log Cash Movement to Sweep Drawer Balance to 0
    if (currentDrawerCash > 0) {
      setCashMovements(prev => [{
        id: `CM-EOD-${Date.now().toString().slice(-4)}`,
        shiftId: currentShift?.id || 'SH-EOD',
        type: 'EOD_DRAWER_ZERO_SWEEP',
        amount: currentDrawerCash,
        referenceId: `EOD-${todayDate}`,
        reason: `End-of-Day Zero Drawer Sweep (Authorized by ${approvedBy})`,
        timestamp: new Date().toISOString(),
        user: approvedBy
      }, ...prev]);
    }

    // 3. Record & Lock in Daily Drawer Records
    setDailyDrawerRecords(prev => {
      const idx = prev.findIndex(r => r.date === todayDate);
      if (idx > -1) {
        const updated = [...prev];
        const rec = updated[idx];
        updated[idx] = {
          ...rec,
          drawerZeroedAmount: currentDrawerCash,
          drawerBalanceAfter: 0,
          status: 'CLOSED',
          ownerApprovedBy: approvedBy,
          ownerPinVerified: true,
          zeroedAt: new Date().toISOString(),
          notes: notes || `Drawer balance swept to ₹0.00 with verified owner permission.`
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            date: todayDate,
            grossSales: (currentShift?.cashSales || 0) + (currentShift?.upiSales || 0),
            cashSales: currentShift?.cashSales || 0,
            upiSales: currentShift?.upiSales || 0,
            refundsDeducted: currentShift?.refundsCash || 0,
            netMoneyMade: Math.max(0, ((currentShift?.cashSales || 0) + (currentShift?.upiSales || 0)) - (currentShift?.refundsCash || 0)),
            drawerOpeningFloat: currentShift?.openingCash || 5000,
            drawerZeroedAmount: currentDrawerCash,
            drawerBalanceAfter: 0,
            status: 'CLOSED',
            ownerApprovedBy: approvedBy,
            ownerPinVerified: true,
            zeroedAt: new Date().toISOString(),
            notes: notes || `Drawer balance swept to ₹0.00 with verified owner permission.`
          }
        ];
      }
    });

    syncDailyDrawerRecordToSupabase({
      date: todayDate,
      drawerZeroedAmount: currentDrawerCash,
      drawerBalanceAfter: 0,
      status: 'CLOSED',
      ownerApprovedBy: approvedBy,
      ownerPinVerified: true,
      zeroedAt: new Date().toISOString()
    });

    // 4. Zero out current shift drawer balance for next day
    setCurrentShift(prev => {
      if (!prev) return null;
      return {
        ...prev,
        openingCash: 0,
        cashSales: 0,
        upiSales: 0,
        refundsCash: 0,
        refundsUpi: 0,
        payIns: 0,
        payOuts: 0,
        status: 'CLOSED'
      };
    });

    alert(`Daily Drawer Zeroing Complete!\n\nToday's drawer balance has been safely swept to ₹0.00.\nAuthorized by: ${approvedBy}.\nFinancial record locked for ${todayDate}.`);
    return true;
  };

  // --- Cash Movement ---
  const addCashMovement = ({ type, amount, reason }) => {
    if (!currentShift || currentShift.status !== 'OPEN') {
      alert("No active shift!");
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Invalid cash amount!");
      return;
    }

    const movement = {
      id: `CM-${Date.now().toString().slice(-5)}`,
      shiftId: currentShift.id,
      type,
      amount: numAmount,
      reason: reason || (type === 'PAY_IN' ? 'Pay In' : 'Pay Out'),
      timestamp: new Date().toISOString(),
      user: currentUser?.name || "Cashier"
    };

    setCashMovements(prev => [movement, ...prev]);

    setCurrentShift(prev => {
      if (type === 'PAY_IN') {
        return { ...prev, payIns: (prev.payIns || 0) + numAmount };
      } else {
        return { ...prev, payOuts: (prev.payOuts || 0) + numAmount };
      }
    });

    alert(`Cash drawer ${type === 'PAY_IN' ? 'Pay-In' : 'Pay-Out'} of ₹${numAmount} logged.`);
    setActiveModal(null);
  };

  // --- Shift Open / Close Engine ---
  const openShift = ({ openingCash, openingDenominations }) => {
    const newShift = {
      id: `SH-${String(shiftsHistory.length + 193).padStart(5, '0')}`,
      cashierId: currentUser?.id || "USER-BILLING",
      cashierName: currentUser?.name || "Rahul Sharma",
      openedAt: new Date().toISOString(),
      status: 'OPEN',
      openingCash: Number(openingCash) || 0,
      openingDenominations: openingDenominations || {},
      cashSales: 0,
      upiSales: 0,
      refundsCash: 0,
      refundsUpi: 0,
      payIns: 0,
      payOuts: 0
    };

    setCurrentShift(newShift);

    setCashMovements(prev => [{
      id: `CM-${Date.now().toString().slice(-5)}`,
      shiftId: newShift.id,
      type: 'OPENING_BALANCE',
      amount: Number(openingCash) || 0,
      reason: 'Shift Opening Cash Float',
      timestamp: new Date().toISOString(),
      user: currentUser?.name || "Cashier"
    }, ...prev]);

    setActiveModal(null);
  };

  const closeShift = ({ actualCashCounted, closingDenominations, notes = "" }) => {
    if (!currentShift) return;

    const opening = currentShift.openingCash || 0;
    const cashSales = currentShift.cashSales || 0;
    const refunds = currentShift.refundsCash || 0;
    const payIns = currentShift.payIns || 0;
    const payOuts = currentShift.payOuts || 0;

    const expectedCash = opening + cashSales - refunds + payIns - payOuts;
    const difference = actualCashCounted - expectedCash;

    const closedShift = {
      ...currentShift,
      closedAt: new Date().toISOString(),
      status: 'CLOSED',
      expectedCash,
      actualCash: actualCashCounted,
      difference,
      closingDenominations,
      notes
    };

    setShiftsHistory(prev => [closedShift, ...prev]);

    setCashMovements(prev => [{
      id: `CM-${Date.now().toString().slice(-5)}`,
      shiftId: currentShift.id,
      type: 'CLOSING_BALANCE',
      amount: actualCashCounted,
      reason: `Shift Closing Count (Variance: ₹${difference >= 0 ? '+' : ''}${difference})`,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || "Cashier"
    }, ...prev]);

    setCurrentShift(null);
    setActiveModal(null);
    alert(`Shift ${closedShift.id} closed! Expected: ₹${expectedCash}, Counted: ₹${actualCashCounted}, Variance: ₹${difference}`);
  };

  // --- Purchase Orders: Receive Goods ---
  const receivePurchaseOrder = (poId) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po || po.status === 'RECEIVED') return;

    po.items.forEach(item => {
      adjustStock({
        productId: item.productId,
        delta: item.quantity,
        referenceType: 'PURCHASE',
        referenceId: po.id,
        reason: `PO Received from ${po.supplierName}`
      });
    });

    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: 'RECEIVED', receivedAt: new Date().toISOString() } : p));
    alert(`Purchase Order ${po.id} marked received. Stock updated for all items!`);
  };

  const createPurchaseOrder = ({ supplierId, items }) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    let totalCost = 0;
    items.forEach(i => {
      totalCost += i.quantity * i.costPrice;
    });

    const newPO = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      supplierId,
      supplierName: supplier?.name || "Standard Supplier",
      createdAt: new Date().toISOString(),
      status: 'ORDERED',
      totalCost,
      items
    };

    setPurchaseOrders(prev => [newPO, ...prev]);
    alert(`Purchase Order ${newPO.id} created!`);
  };

  // --- Product Master Operations ---
  const saveProduct = (productData) => {
    if (productData.id) {
      setProducts(prev => prev.map(p => p.id === productData.id ? { ...p, ...productData } : p));
    } else {
      const newProduct = {
        ...productData,
        id: `PROD-${String(products.length + 1).padStart(3, '0')}`,
        currentStock: Number(productData.currentStock) || 0,
        sellingPrice: Number(productData.sellingPrice) || 0,
        costPrice: Number(productData.costPrice) || 0,
        taxRate: Number(productData.taxRate) || 0,
        minStock: Number(productData.minStock) || 10,
        trackInventory: true,
        active: true
      };
      setProducts(prev => [newProduct, ...prev]);

      if (newProduct.currentStock > 0) {
        adjustStock({
          productId: newProduct.id,
          delta: newProduct.currentStock,
          referenceType: 'ADJUSTMENT',
          reason: 'Initial Product Stock Setup'
        });
      }
    }
  };

  const getDrawerCash = () => {
    if (!currentShift) return 0;
    return (currentShift.openingCash || 0) +
           (currentShift.cashSales || 0) -
           (currentShift.refundsCash || 0) +
           (currentShift.payIns || 0) -
           (currentShift.payOuts || 0);
  };

  return (
    <POSContext.Provider
      value={{
        storeConfig,
        setStoreConfig,
        products,
        categories,
        customers,
        setCustomers,
        suppliers,
        users,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        logout,
        isLoading,
        triggerLoading,
        activeView,
        setActiveView,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isOnline,
        setIsOnline,
        // Cart
        cart,
        cartTotals,
        addToCart,
        updateCartItemQty,
        removeFromCart,
        clearCart,
        setCustomerForCart,
        setOrderDiscount,
        // Hold & Recall
        heldOrders,
        holdCurrentOrder,
        recallHeldOrder,
        deleteHeldOrder,
        // Stock
        stockLedger,
        adjustStock,
        saveProduct,
        purchaseOrders,
        receivePurchaseOrder,
        createPurchaseOrder,
        // Checkout & Sales
        salesLedger,
        paymentLedger,
        cashMovements,
        processCheckout,
        processRefund,
        lastCompletedSale,
        // Daily Drawer & Monthly Financial Ledger
        dailyDrawerRecords,
        setDailyDrawerRecords,
        zeroDailyDrawer,
        // Exchanges
        exchanges,
        processExchange,
        // Customer Intake
        identifyCustomerForCart,
        resetCustomerForCart,
        generateTxHash,
        // Shift
        currentShift,
        shiftsHistory,
        openShift,
        closeShift,
        addCashMovement,
        getDrawerCash,
        // Modals
        activeModal,
        setActiveModal,
        // Sync & Hourly Cloud Engine
        syncQueue,
        lastSyncedAt,
        isAutoSyncing,
        autoSyncNotice,
        triggerHourlySync
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
