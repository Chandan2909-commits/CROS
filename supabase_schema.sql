-- ============================================================
-- CROS — CrossTech Retail Operating System
-- PostgreSQL / Supabase Database Schema
-- Engineered from brain.md (Section 27-33)
-- Includes: 8-digit TxHash, Offline Sync, Daily Drawer Records, Product Exchanges
-- ============================================================

-- 1. Users / Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('cashier', 'admin', 'manager', 'owner')),
  pin TEXT,
  avatar TEXT,
  store_id TEXT DEFAULT 'STORE-01',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Products Master
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  unit TEXT DEFAULT 'pcs',
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  tax_rate NUMERIC(5,2) DEFAULT 0.00,
  min_stock INTEGER DEFAULT 10,
  current_stock INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  total_purchases INTEGER DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0.00,
  loyalty_points INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. POS Shifts (Cash Drawer Ledger)
CREATE TABLE IF NOT EXISTS public.pos_shifts (
  id TEXT PRIMARY KEY,
  cashier_id TEXT NOT NULL,
  cashier_name TEXT NOT NULL,
  opened_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  closed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  opening_cash NUMERIC(10,2) DEFAULT 0.00,
  expected_cash NUMERIC(10,2) DEFAULT 0.00,
  actual_cash NUMERIC(10,2) DEFAULT 0.00,
  difference NUMERIC(10,2) DEFAULT 0.00,
  cash_sales NUMERIC(10,2) DEFAULT 0.00,
  upi_sales NUMERIC(10,2) DEFAULT 0.00,
  refunds_cash NUMERIC(10,2) DEFAULT 0.00,
  refunds_upi NUMERIC(10,2) DEFAULT 0.00,
  pay_ins NUMERIC(10,2) DEFAULT 0.00,
  pay_outs NUMERIC(10,2) DEFAULT 0.00,
  notes TEXT
);

-- 5. Sales Ledger (What was sold, with 8-character unique TxHash)
CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  tx_hash VARCHAR(8) UNIQUE NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  shift_id TEXT REFERENCES public.pos_shifts(id),
  cashier_id TEXT NOT NULL,
  cashier_name TEXT NOT NULL,
  customer_id TEXT REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  subtotal NUMERIC(10,2) NOT NULL,
  discount_total NUMERIC(10,2) DEFAULT 0.00,
  tax_total NUMERIC(10,2) DEFAULT 0.00,
  rounding NUMERIC(5,2) DEFAULT 0.00,
  grand_total NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'SPLIT')),
  status TEXT DEFAULT 'COMPLETED',
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Payment Ledger (What was paid)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  tx_hash VARCHAR(8) NOT NULL,
  sale_id TEXT REFERENCES public.sales(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  shift_id TEXT REFERENCES public.pos_shifts(id),
  method TEXT NOT NULL CHECK (method IN ('CASH', 'UPI')),
  amount_due NUMERIC(10,2) NOT NULL,
  amount_received NUMERIC(10,2) NOT NULL,
  change_given NUMERIC(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',
  provider TEXT,
  provider_txn_id TEXT,
  status TEXT DEFAULT 'SUCCESS',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Immutable Stock Ledger (Physical inventory movements)
CREATE TABLE IF NOT EXISTS public.stock_ledger (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  product_id TEXT REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  delta INTEGER NOT NULL,
  prev_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN', 'TRANSFER')),
  reference_id TEXT,
  reason TEXT NOT NULL,
  user_name TEXT NOT NULL
);

-- 8. Cash Drawer Movements Ledger (Drawer Float Audit)
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id TEXT PRIMARY KEY,
  shift_id TEXT REFERENCES public.pos_shifts(id),
  type TEXT NOT NULL CHECK (type IN ('OPENING_BALANCE', 'SALE', 'REFUND', 'PAY_IN', 'PAY_OUT', 'EOD_DRAWER_ZERO_SWEEP', 'CLOSING_BALANCE')),
  amount NUMERIC(10,2) NOT NULL,
  reference_id TEXT,
  reason TEXT NOT NULL,
  user_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Daily Drawer Records (Daily Money Made & EOD Zero Sweep with Owner Permission)
CREATE TABLE IF NOT EXISTS public.daily_drawer_records (
  date DATE PRIMARY KEY,
  gross_sales NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  cash_sales NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  upi_sales NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  refunds_deducted NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  net_money_made NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  drawer_opening_float NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  drawer_zeroed_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  drawer_balance_after NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  owner_approved_by TEXT,
  owner_pin_verified BOOLEAN DEFAULT false,
  zeroed_at TIMESTAMPTZ,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Product Exchanges Ledger
CREATE TABLE IF NOT EXISTS public.exchanges (
  id TEXT PRIMARY KEY,
  tx_hash VARCHAR(8) UNIQUE NOT NULL,
  original_tx_hash VARCHAR(8),
  original_invoice TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  returned_items JSONB NOT NULL,
  new_items JSONB NOT NULL,
  returned_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  new_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  difference_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  payment_method TEXT NOT NULL,
  cashier_id TEXT,
  cashier_name TEXT,
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
