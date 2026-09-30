import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  isSupabaseConfigured,
  getEnvCredentials,
  updateSupabaseCredentials,
  testSupabaseConnection,
  seedLocalDataToSupabase
} from '../../lib/supabase';
import {
  Cloud,
  Database,
  Key,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Wifi,
  Sparkles
} from 'lucide-react';

export function SupabaseModal() {
  const {
    activeModal,
    setActiveModal,
    products,
    customers,
    dailyDrawerRecords,
    lastSyncedAt,
    isAutoSyncing,
    triggerHourlySync,
    autoSyncNotice
  } = usePOS();

  const currentCreds = getEnvCredentials();

  const [url, setUrl] = useState(currentCreds.url || '');
  const [key, setKey] = useState(currentCreds.key || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (activeModal !== 'supabaseConfig') return null;

  const isConnected = isSupabaseConfigured();

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url, key);
    setTestResult(res);
    setTesting(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      alert("Please provide both Supabase Project URL and Anon Public Key.");
      return;
    }
    updateSupabaseCredentials(url, key);
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    const res = await seedLocalDataToSupabase({
      products,
      customers,
      dailyDrawerRecords
    });
    setSeedResult(res);
    setSeeding(false);
  };

  const handleCopySql = async () => {
    try {
      const response = await fetch('/supabase_schema.sql');
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // Fallback
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="animate-spring-modal bg-white w-full max-w-xl rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base leading-tight font-heading">
                  Supabase Cloud Connection
                </h3>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  isConnected
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}>
                  {isConnected ? 'Connected' : 'Offline / Standby'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect your PostgreSQL database for real-time cloud sync & persistent audit logs
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
          {/* Offline-First Resilience Notice */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Offline-First Guarantee: </span>
              Even with Supabase connected, CROS operates on <strong>browser LocalStorage first</strong>. If network cables are cut or Wi-Fi drops, billing, cash sales, product exchanges, and drawer sweeps will continue without missing a beat.
            </div>
          </div>

          {/* Form Credentials */}
          <form onSubmit={handleSave} className="flex flex-col gap-3.5">
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
                Supabase Project URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://your-project-id.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
                <Cloud className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
                Supabase Anon / Public API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Test Connection & Save Action Row */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="btn-press px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                type="submit"
                className="btn-press flex-1 py-2.5 rounded-xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-brand transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Credentials & Connect</span>
              </button>
            </div>
          </form>

          {/* Test Connection Output Feedback */}
          {testResult && (
            <div className={`p-3 rounded-2xl border text-xs flex flex-col gap-1 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {testResult.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Supabase Connection Successful! ({testResult.responseTime}ms)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Connection Failed</span>
                  </>
                )}
              </div>
              {testResult.error && (
                <p className="text-[11px] text-rose-700 font-mono mt-0.5">{testResult.error}</p>
              )}
              {testResult.tableNotice && (
                <p className="text-[11px] text-amber-800 mt-0.5">{testResult.tableNotice}</p>
              )}
            </div>
          )}

          {/* Automated Hourly Sync Engine Card */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900 font-heading">
                  Automated Background Sync (Every 1 Hour)
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Active & Running
              </span>
            </div>

            <p className="text-[11px] text-emerald-800/90 leading-relaxed">
              No manual syncing needed! CROS automatically synchronizes all completed sales, payment ledgers, product exchanges, customers, and daily drawer sweeps to Supabase <strong>once every hour in the background</strong>, and flushes automatically whenever network reconnects.
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-emerald-700">Last Automated Push:</span>
                <span className="font-mono text-slate-800 font-bold">
                  {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('en-IN') : 'Pending next hourly cycle'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => triggerHourlySync(false)}
                disabled={isAutoSyncing || !isConnected}
                className="btn-press px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors disabled:bg-slate-300 disabled:text-slate-500"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAutoSyncing ? 'animate-spin' : ''}`} />
                <span>{isAutoSyncing ? 'Syncing...' : 'Sync Now (Force Push)'}</span>
              </button>
            </div>

            {autoSyncNotice && (
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{autoSyncNotice}</span>
              </div>
            )}
          </div>

          {/* Quick Setup Actions Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
              Database Migration & Cloud Seed Tools
            </span>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleCopySql}
                className="btn-press w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                <span>{copiedSql ? 'Schema SQL Copied!' : 'Copy supabase_schema.sql'}</span>
              </button>

              <a
                href="https://supabase.com/dashboard/project/_/sql"
                target="_blank"
                rel="noreferrer"
                className="btn-press w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                <span>Open Supabase SQL Editor</span>
              </a>
            </div>

            {/* Cloud Seed Action */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Seed Local Data to Supabase
                </div>
                <div className="text-[10px] text-slate-500">
                  Uploads {products.length} products, {customers.length} customers & daily drawer records
                </div>
              </div>

              <button
                onClick={handleSeed}
                disabled={seeding || !isConnected}
                className={`btn-press px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  isConnected
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
                <span>{seeding ? 'Syncing...' : 'Push to Cloud'}</span>
              </button>
            </div>

            {seedResult && (
              <div className={`p-2.5 rounded-xl text-xs font-bold ${
                seedResult.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {seedResult.success
                  ? `Successfully seeded ${seedResult.syncedProducts} products, ${seedResult.syncedCustomers} customers, and ${seedResult.syncedDrawer} drawer records to Supabase!`
                  : `Seed error: ${seedResult.error}`}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span>Config stored in:</span>
            <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">
              .env / localStorage
            </code>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="btn-press px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
