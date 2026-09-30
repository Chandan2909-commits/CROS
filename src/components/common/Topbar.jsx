import React from 'react';
import { usePOS } from '../../context/POSContext';
import { 
  Store, 
  Layers, 
  Wifi, 
  WifiOff, 
  Clock, 
  DollarSign, 
  User, 
  ChevronDown, 
  Terminal,
  Sparkles,
  Lock,
  LogOut,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

export function Topbar() {
  const {
    storeConfig,
    currentShift,
    currentUser,
    setCurrentUser,
    logout,
    activeView,
    setActiveView,
    getDrawerCash,
    isOnline,
    setIsOnline,
    syncQueue,
    setActiveModal,
    isLoading,
    lastSyncedAt,
    isAutoSyncing,
    autoSyncNotice
  } = usePOS();

  const isPosMode = activeView === 'pos';
  const drawerCash = getDrawerCash();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="relative mx-4 mt-3 mb-2 h-14 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.02)] flex items-center justify-between px-4 z-20">
      {/* Running Progress Loader Line at Top - ONLY when loading */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-[2.5px] overflow-hidden rounded-t-2xl pointer-events-none">
          <div className="running-loader-bar w-1/3 h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 opacity-90"></div>
        </div>
      )}

      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#1e1e1e] text-white shadow-sm font-extrabold text-sm tracking-wider">
          CR
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm tracking-tight font-heading">
              CROS
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
              Retail OS
            </span>
          </div>
          <span className="text-[10.5px] font-medium text-slate-400 -mt-0.5">
            by crosstechsolutions
          </span>
        </div>
      </div>

      {/* Center: Shift Status & Role-Guarded Mode Switcher */}
      <div className="flex items-center gap-2.5">
        {/* Active Shift Indicator */}
        {currentShift && currentShift.status === 'OPEN' ? (
          <button
            onClick={() => setActiveModal('cashMovement')}
            className="btn-press flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold hover:bg-emerald-100/60"
            title="Click to log Cash Drawer Pay-In / Pay-Out"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow"></span>
            <span>Shift #{currentShift.id}</span>
            <span className="text-emerald-400">|</span>
            <span className="font-mono font-bold text-emerald-900">
              Drawer: ₹{drawerCash.toLocaleString('en-IN')}
            </span>
          </button>
        ) : (
          <button
            onClick={() => setActiveModal('shiftOpen')}
            className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>No Shift Active — Click to Open</span>
          </button>
        )}

        {/* Mode Toggle: Available ONLY for Administrators/Managers, Hidden from Cashiers */}
        {isAdmin ? (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/70 text-xs font-semibold">
            <button
              onClick={() => setActiveView('pos')}
              className={`px-3 py-1 rounded-lg transition-all ${
                isPosMode
                  ? 'bg-[#1e1e1e] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Billing Counter
            </button>
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1 rounded-lg transition-all ${
                !isPosMode
                  ? 'bg-[#1e1e1e] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin Back Office
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>Billing Agent Terminal</span>
          </div>
        )}
      </div>

      {/* Right Controls: Online/Offline, User Profile & Lock */}
      <div className="flex items-center gap-2">

        {/* Supabase Cloud Connection & Automated Hourly Sync Button */}
        <button
          onClick={() => setActiveModal('supabaseConfig')}
          className={`btn-press flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            isAutoSyncing
              ? 'bg-blue-50 border-blue-300 text-blue-800'
              : autoSyncNotice
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : isOnline
              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
          title={
            lastSyncedAt
              ? `Auto-syncs every 1 hour • Last synced: ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : "Supabase Cloud Auto-Sync (Every 1 hour). Click to configure."
          }
        >
          {isAutoSyncing ? (
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          ) : isOnline ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-rose-500" />
          )}

          <span className="text-[11px] font-semibold">
            {isAutoSyncing
              ? 'Syncing...'
              : autoSyncNotice
              ? 'Auto-Synced ✓'
              : isOnline
              ? 'Cloud (1h Auto)'
              : 'Offline Mode'}
          </span>

          {syncQueue.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold" title="Unsynced offline transactions">
              {syncQueue.length}
            </span>
          )}
        </button>

        {/* User Role Badge & Lock Terminal Action */}
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-full pl-1.5 pr-2.5 py-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] text-white ${
              isAdmin ? 'bg-emerald-600' : 'bg-blue-600'
            }`}>
              {currentUser?.avatar || 'U'}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-slate-800 leading-tight">
                {currentUser?.name?.split(' ')[0]}
              </span>
              <span className={`text-[9px] font-bold uppercase leading-none ${
                isAdmin ? 'text-emerald-700' : 'text-blue-700'
              }`}>
                {isAdmin ? 'Admin' : 'Cashier'}
              </span>
            </div>
          </div>

          {/* Switch Cashier / Lock Terminal Button */}
          <button
            onClick={logout}
            className="btn-press p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Lock Terminal / Switch Role"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
