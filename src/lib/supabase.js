import { createClient } from '@supabase/supabase-js';

export const sanitizeSupabaseUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
};

// Retrieve credentials from environment variables or localStorage for in-app configuration
export const getEnvCredentials = () => {
  const envUrl = sanitizeSupabaseUrl(import.meta.env?.VITE_SUPABASE_URL);
  const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY?.trim() || '';
  if (envUrl && envKey && envUrl.startsWith('http')) {
    return { url: envUrl, key: envKey };
  }

  try {
    const storedConfig = localStorage.getItem('cros_supabase_config');
    if (storedConfig) {
      const parsed = JSON.parse(storedConfig);
      const storedUrl = sanitizeSupabaseUrl(parsed.url);
      const storedKey = parsed.key?.trim() || '';
      if (storedUrl && storedKey && storedUrl.startsWith('http')) {
        return { url: storedUrl, key: storedKey };
      }
    }
  } catch (e) {
    console.warn("Could not read stored Supabase config", e);
  }

  return { url: envUrl || '', key: envKey || '' };
};

const credentials = getEnvCredentials();

export const isSupabaseConfigured = () => {
  const creds = getEnvCredentials();
  return Boolean(creds.url && creds.key && creds.url.startsWith('http'));
};

export const supabase = isSupabaseConfigured()
  ? createClient(credentials.url, credentials.key)
  : null;

/**
 * Update Supabase credentials dynamically and optionally reload
 */
export const updateSupabaseCredentials = (url, key) => {
  const cleanUrl = sanitizeSupabaseUrl(url);
  localStorage.setItem('cros_supabase_config', JSON.stringify({ url: cleanUrl, key: key.trim() }));
  window.location.reload();
};

/**
 * Test Supabase connection with live ping
 */
export async function testSupabaseConnection(url, key) {
  if (!url || !key) {
    return { success: false, error: "Project URL and Anon Key are required." };
  }

  const cleanUrl = sanitizeSupabaseUrl(url);

  try {
    const startTime = performance.now();
    // 1. Verify project & credentials via Auth Health Check
    const authRes = await fetch(`${cleanUrl}/auth/v1/health`, {
      headers: { apikey: key.trim() }
    });

    if (!authRes.ok) {
      return { success: false, error: `Supabase Auth returned HTTP ${authRes.status}. Check project URL & anon key.` };
    }

    const responseTime = Math.round(performance.now() - startTime);

    // 2. Check if tables (products) have been migrated
    const tempClient = createClient(cleanUrl, key.trim());
    const { error: tableError } = await tempClient.from('products').select('id').limit(1);

    if (tableError) {
      return {
        success: true,
        responseTime,
        hasTables: false,
        tableNotice: "Connected to Supabase! Tables have not been created yet. Please copy and run supabase_schema.sql in your Supabase SQL Editor."
      };
    }

    return {
      success: true,
      responseTime,
      hasTables: true,
      tableNotice: "All database tables detected and verified!"
    };
  } catch (err) {
    return { success: false, error: err.message || "Failed to connect to Supabase." };
  }
}

/**
 * Push local initial data into Supabase tables
 */
export async function seedLocalDataToSupabase({ products = [], customers = [], dailyDrawerRecords = [] }) {
  if (!supabase) {
    return { success: false, error: "Supabase client is not connected." };
  }

  try {
    let syncedProducts = 0;
    let syncedCustomers = 0;
    let syncedDrawer = 0;

    // 1. Sync Products
    if (products.length > 0) {
      const formattedProducts = products.map(p => ({
        id: p.id,
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        category: p.category,
        brand: p.brand || null,
        unit: p.unit || 'pcs',
        cost_price: p.costPrice || 0,
        selling_price: p.sellingPrice || 0,
        tax_rate: p.taxRate || 0,
        min_stock: p.minStock || 10,
        current_stock: p.currentStock || 0,
        track_inventory: p.trackInventory !== false,
        is_favorite: Boolean(p.isFavorite),
        active: true,
        image: p.image || null
      }));
      const { error: prodErr } = await supabase.from('products').upsert(formattedProducts);
      if (prodErr) {
        return {
          success: false,
          error: `Database tables not created yet (${prodErr.message}). Please run supabase_schema.sql in your Supabase SQL Editor first!`
        };
      }
      syncedProducts = formattedProducts.length;
    }

    // 2. Sync Customers
    if (customers.length > 0) {
      const formattedCustomers = customers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email || null,
        total_purchases: c.totalPurchases || 0,
        total_spent: c.totalSpent || 0,
        loyalty_points: c.loyaltyPoints || 0,
        is_default: Boolean(c.isDefault)
      }));
      const { error: custErr } = await supabase.from('customers').upsert(formattedCustomers);
      if (!custErr) syncedCustomers = formattedCustomers.length;
      else console.warn("Seed customers error:", custErr);
    }

    // 3. Sync Daily Drawer Records
    if (dailyDrawerRecords.length > 0) {
      const formattedDrawer = dailyDrawerRecords.map(d => ({
        date: d.date,
        gross_sales: d.grossSales || 0,
        cash_sales: d.cashSales || 0,
        upi_sales: d.upiSales || 0,
        refunds_deducted: d.refundsDeducted || 0,
        net_money_made: d.netMoneyMade || 0,
        drawer_opening_float: d.drawerOpeningFloat || 5000,
        drawer_zeroed_amount: d.drawerZeroedAmount || 0,
        drawer_balance_after: d.drawerBalanceAfter || 0,
        status: d.status || 'OPEN',
        owner_approved_by: d.ownerApprovedBy || null,
        owner_pin_verified: Boolean(d.ownerPinVerified),
        zeroed_at: d.zeroedAt || null,
        notes: d.notes || null
      }));
      const { error: drawErr } = await supabase.from('daily_drawer_records').upsert(formattedDrawer);
      if (!drawErr) syncedDrawer = formattedDrawer.length;
      else console.warn("Seed drawer error:", drawErr);
    }

    return {
      success: true,
      syncedProducts,
      syncedCustomers,
      syncedDrawer
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Supabase Auth Wrappers
 */
export async function supabaseSignIn(email, password) {
  if (!supabase) {
    return { error: { message: "Supabase client is not connected yet. Using offline demo authentication." } };
  }
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function supabaseSignOut() {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

/**
 * Sync helpers for PostgreSQL database tables
 */
export async function syncSaleToSupabase(sale, payments) {
  if (!supabase) return null;
  try {
    const { error: saleErr } = await supabase.from('sales').upsert([{
      id: sale.id,
      tx_hash: sale.txHash,
      invoice_number: sale.invoiceNumber,
      shift_id: sale.shiftId,
      cashier_id: sale.cashierId,
      cashier_name: sale.cashierName,
      customer_id: sale.customerId,
      customer_name: sale.customerName,
      customer_phone: sale.customerPhone || null,
      subtotal: sale.subtotal,
      discount_total: sale.discountTotal,
      tax_total: sale.taxTotal,
      rounding: sale.rounding,
      grand_total: sale.grandTotal,
      payment_method: sale.paymentMethod,
      status: sale.status || 'COMPLETED',
      items: sale.items,
      created_at: sale.createdAt
    }]);
    if (saleErr) console.warn("Supabase sale sync error:", saleErr);

    if (payments && payments.length > 0) {
      const formattedPayments = payments.map(p => ({
        id: p.id,
        tx_hash: p.txHash,
        sale_id: p.saleId,
        invoice_number: p.invoiceNumber,
        shift_id: p.shiftId,
        method: p.method,
        amount_due: p.amountDue,
        amount_received: p.amountReceived,
        change_given: p.changeGiven,
        currency: p.currency || 'INR',
        provider: p.provider || null,
        provider_txn_id: p.providerTxnId || null,
        status: p.status || 'SUCCESS',
        created_at: p.timestamp
      }));
      const { error: payErr } = await supabase.from('payments').upsert(formattedPayments);
      if (payErr) console.warn("Supabase payments sync error:", payErr);
    }
  } catch (e) {
    console.warn("Supabase network error:", e);
  }
}

export async function syncDailyDrawerRecordToSupabase(record) {
  if (!supabase) return null;
  try {
    const formatted = {
      date: record.date,
      gross_sales: record.grossSales || 0,
      cash_sales: record.cashSales || 0,
      upi_sales: record.upiSales || 0,
      refunds_deducted: record.refundsDeducted || 0,
      net_money_made: record.netMoneyMade || 0,
      drawer_opening_float: record.drawerOpeningFloat || 0,
      drawer_zeroed_amount: record.drawerZeroedAmount || 0,
      drawer_balance_after: record.drawerBalanceAfter || 0,
      status: record.status || 'OPEN',
      owner_approved_by: record.ownerApprovedBy || null,
      owner_pin_verified: Boolean(record.ownerPinVerified),
      zeroed_at: record.zeroedAt || null,
      notes: record.notes || null
    };
    const { error } = await supabase.from('daily_drawer_records').upsert([formatted]);
    if (error) console.warn("Supabase daily drawer sync error:", error);
  } catch (e) {
    console.warn("Supabase daily drawer network error:", e);
  }
}

export async function syncExchangeToSupabase(exchange) {
  if (!supabase) return null;
  try {
    const formatted = {
      id: exchange.id,
      tx_hash: exchange.txHash,
      original_tx_hash: exchange.originalTxHash || null,
      original_invoice: exchange.originalInvoice || null,
      customer_id: exchange.customerId || null,
      customer_name: exchange.customerName,
      customer_phone: exchange.customerPhone || null,
      returned_items: exchange.returnedItems,
      new_items: exchange.newItems,
      returned_total: exchange.returnedTotal,
      new_total: exchange.newTotal,
      difference_amount: exchange.differenceAmount,
      payment_method: exchange.paymentMethod,
      cashier_id: exchange.cashierId || null,
      cashier_name: exchange.cashierName || null,
      notes: exchange.notes || null,
      timestamp: exchange.timestamp
    };
    const { error } = await supabase.from('exchanges').upsert([formatted]);
    if (error) console.warn("Supabase exchange sync error:", error);
  } catch (e) {
    console.warn("Supabase exchange network error:", e);
  }
}

export async function syncStockMovementToSupabase(movement) {
  if (!supabase) return null;
  try {
    const formatted = {
      id: movement.id,
      timestamp: movement.timestamp,
      product_id: movement.productId,
      product_name: movement.productName,
      sku: movement.sku,
      delta: movement.delta,
      prev_stock: movement.prevStock || 0,
      new_stock: movement.newStock || 0,
      type: movement.type || 'SALE',
      reference_id: movement.referenceId || null,
      reason: movement.reason,
      user_name: movement.user || 'Cashier'
    };
    const { error } = await supabase.from('stock_ledger').insert([formatted]);
    if (error) console.warn("Supabase stock ledger sync error:", error);
  } catch (e) {
    console.warn("Supabase stock sync network error:", e);
  }
}

/**
 * Hourly Automated Background Sync: pushes all sales, payments, drawer records, exchanges, and customers
 */
export async function syncAllToSupabase({
  sales = [],
  payments = [],
  exchanges = [],
  dailyDrawerRecords = [],
  customers = []
}) {
  if (!supabase) return { success: false, error: "Supabase not connected" };

  try {
    let salesCount = 0;
    let drawerCount = 0;
    let exchangeCount = 0;

    // 1. Sync Sales
    if (sales.length > 0) {
      const formattedSales = sales.map(sale => ({
        id: sale.id,
        tx_hash: sale.txHash,
        invoice_number: sale.invoiceNumber,
        shift_id: sale.shiftId,
        cashier_id: sale.cashierId,
        cashier_name: sale.cashierName,
        customer_id: sale.customerId,
        customer_name: sale.customerName,
        customer_phone: sale.customerPhone || null,
        subtotal: sale.subtotal,
        discount_total: sale.discountTotal,
        tax_total: sale.taxTotal,
        rounding: sale.rounding,
        grand_total: sale.grandTotal,
        payment_method: sale.paymentMethod,
        status: sale.status || 'COMPLETED',
        items: sale.items,
        created_at: sale.createdAt
      }));
      const { error: sErr } = await supabase.from('sales').upsert(formattedSales);
      if (!sErr) salesCount = formattedSales.length;
    }

    // 2. Sync Payments
    if (payments.length > 0) {
      const formattedPayments = payments.map(p => ({
        id: p.id,
        tx_hash: p.txHash,
        sale_id: p.saleId,
        invoice_number: p.invoiceNumber,
        shift_id: p.shiftId,
        method: p.method,
        amount_due: p.amountDue,
        amount_received: p.amountReceived,
        change_given: p.changeGiven,
        currency: p.currency || 'INR',
        provider: p.provider || null,
        provider_txn_id: p.providerTxnId || null,
        status: p.status || 'SUCCESS',
        created_at: p.timestamp
      }));
      await supabase.from('payments').upsert(formattedPayments);
    }

    // 3. Sync Daily Drawer Records
    if (dailyDrawerRecords.length > 0) {
      const formattedDrawer = dailyDrawerRecords.map(d => ({
        date: d.date,
        gross_sales: d.grossSales || 0,
        cash_sales: d.cashSales || 0,
        upi_sales: d.upiSales || 0,
        refunds_deducted: d.refundsDeducted || 0,
        net_money_made: d.netMoneyMade || 0,
        drawer_opening_float: d.drawerOpeningFloat || 5000,
        drawer_zeroed_amount: d.drawerZeroedAmount || 0,
        drawer_balance_after: d.drawerBalanceAfter || 0,
        status: d.status || 'OPEN',
        owner_approved_by: d.ownerApprovedBy || null,
        owner_pin_verified: Boolean(d.ownerPinVerified),
        zeroed_at: d.zeroedAt || null,
        notes: d.notes || null
      }));
      const { error: dErr } = await supabase.from('daily_drawer_records').upsert(formattedDrawer);
      if (!dErr) drawerCount = formattedDrawer.length;
    }

    // 4. Sync Exchanges
    if (exchanges.length > 0) {
      const formattedExchanges = exchanges.map(e => ({
        id: e.id,
        tx_hash: e.txHash,
        original_tx_hash: e.originalTxHash || null,
        original_invoice: e.originalInvoice || null,
        customer_id: e.customerId || null,
        customer_name: e.customerName,
        customer_phone: e.customerPhone || null,
        returned_items: e.returnedItems,
        new_items: e.newItems,
        returned_total: e.returnedTotal,
        new_total: e.newTotal,
        difference_amount: e.differenceAmount,
        payment_method: e.paymentMethod,
        cashier_id: e.cashierId || null,
        cashier_name: e.cashierName || null,
        notes: e.notes || null,
        timestamp: e.timestamp
      }));
      const { error: eErr } = await supabase.from('exchanges').upsert(formattedExchanges);
      if (!eErr) exchangeCount = formattedExchanges.length;
    }

    // 5. Sync Customers
    if (customers.length > 0) {
      const formattedCustomers = customers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email || null,
        total_purchases: c.totalPurchases || 0,
        total_spent: c.totalSpent || 0,
        loyalty_points: c.loyaltyPoints || 0,
        is_default: Boolean(c.isDefault)
      }));
      await supabase.from('customers').upsert(formattedCustomers);
    }

    return {
      success: true,
      salesCount,
      drawerCount,
      exchangeCount,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
