import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { isSupabaseConfigured, updateSupabaseCredentials } from '../../lib/supabase';
import {
  Settings,
  Store,
  Receipt,
  Terminal,
  Save,
  CheckCircle2,
  Wifi,
  Cloud,
  Layers,
  Database,
  Key,
  ExternalLink
} from 'lucide-react';

export function SettingsView() {
  const {
    storeConfig,
    setStoreConfig,
    isOnline,
    setIsOnline,
    syncQueue
  } = usePOS();

  const [formData, setFormData] = useState({ ...storeConfig });
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Supabase Configuration State
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    try {
      const stored = localStorage.getItem('cros_supabase_config');
      if (stored) return JSON.parse(stored).url || '';
    } catch {}
    return import.meta.env?.VITE_SUPABASE_URL || '';
  });

  const [supabaseKey, setSupabaseKey] = useState(() => {
    try {
      const stored = localStorage.getItem('cros_supabase_config');
      if (stored) return JSON.parse(stored).key || '';
    } catch {}
    return import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
  });

  const isConnected = isSupabaseConfigured();

  const handleSubmit = (e) => {
    e.preventDefault();
    setStoreConfig(formData);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleSaveSupabase = (e) => {
    e.preventDefault();
    updateSupabaseCredentials(supabaseUrl, supabaseKey);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 font-heading">
            Store & Cloud Configuration
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure store legal profile, Supabase Cloud Auth & Database, and terminal hardware
          </p>
        </div>

        {isSavedNotice && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 animate-spring-modal">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Supabase Cloud Database & Auth Configuration */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading">
                Supabase Auth & Database
              </h2>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {isConnected ? '● Connected to Supabase' : 'Offline Storage Active'}
            </span>
          </div>

          <form onSubmit={handleSaveSupabase} className="flex flex-col gap-3">
            <div>
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full font-mono text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
              />
            </div>

            <div>
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full font-mono text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
              />
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
              <span className="font-bold block mb-0.5">PostgreSQL Database Schema:</span>
              <span>All 8 tables (sales, products, stock_ledger, shifts, payments, profiles) are pre-scripted in <code className="bg-white px-1.5 py-0.2 rounded border font-mono">supabase_schema.sql</code>.</span>
            </div>

            <button
              type="submit"
              className="btn-press py-3 rounded-2xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 mt-1"
            >
              <Save className="w-4 h-4" />
              <span>Connect Supabase & Save</span>
            </button>
          </form>
        </div>

        {/* Card 2: Store Legal & Brand Profile */}
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Store className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading">
              Store & Tax Identity
            </h2>
          </div>

          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Store Legal Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
            />
          </div>

          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Store Address (Printed on Receipts)
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                GSTIN Number
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full font-mono text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
              />
            </div>

            <div>
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Store Telephone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full font-mono text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-press py-3 rounded-2xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-brand flex items-center justify-center gap-2 mt-auto"
          >
            <Save className="w-4 h-4" />
            <span>Update Store Profile</span>
          </button>
        </form>
      </div>
    </div>
  );
}
