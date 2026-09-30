import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { INITIAL_USERS } from '../../data/initialData';
import { supabaseSignIn, isSupabaseConfigured } from '../../lib/supabase';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  KeyRound,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function LoginScreen() {
  const { setCurrentUser, setActiveView } = usePOS();

  // Tab: 'ROLE_SELECT' | 'EMAIL_SUPABASE'
  const [authMethod, setAuthMethod] = useState('ROLE_SELECT');
  const [selectedRole, setSelectedRole] = useState('cashier'); // 'cashier' | 'admin'

  // PIN state
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Supabase Auth credentials state
  const [supabaseEmail, setSupabaseEmail] = useState('');
  const [supabasePassword, setSupabasePassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleQuickLogin = (user) => {
    setCurrentUser(user);
    // If cashier, automatically route to billing counter POS
    if (user.role === 'cashier') {
      setActiveView('pos');
    } else {
      setActiveView('dashboard');
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Match user with entered PIN and role
    const matchedUser = INITIAL_USERS.find(
      u => u.role === selectedRole && u.pin === enteredPin.trim()
    );

    if (matchedUser) {
      handleRoleQuickLogin(matchedUser);
    } else {
      setErrorMessage(`Incorrect PIN for ${selectedRole === 'cashier' ? 'Billing Agent' : 'Admin'}. (Hint: Cashier is 1234, Admin is 9999)`);
    }
  };

  const handleSupabaseSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const res = await supabaseSignIn(supabaseEmail, supabasePassword);
    setIsSubmitting(false);

    if (res?.error) {
      setErrorMessage(res.error.message);
    } else {
      // Create user session from Supabase user
      const user = {
        id: res.data.user.id,
        email: res.data.user.email,
        name: res.data.user.user_metadata?.name || res.data.user.email.split('@')[0],
        role: res.data.user.user_metadata?.role || selectedRole,
        roleTitle: selectedRole === 'admin' ? 'Store Manager & Admin' : 'Billing Agent / Cashier',
        avatar: (res.data.user.email[0] || 'U').toUpperCase()
      };
      handleRoleQuickLogin(user);
    }
  };

  const cashierUser = INITIAL_USERS.find(u => u.role === 'cashier');
  const adminUser = INITIAL_USERS.find(u => u.id === 'USER-ADMIN');
  const ownerUser = INITIAL_USERS.find(u => u.id === 'USER-OWNER');

  return (
    <div className="fixed inset-0 bg-[#0b1120] text-slate-900 z-50 flex items-center justify-center p-4 select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="animate-spring-modal relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10">
        {/* Brand Banner Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center font-extrabold text-xl shadow-lg mb-3">
            CR
          </div>
          <h1 className="text-xl font-extrabold font-heading tracking-tight">
            CROS — Retail Operating System
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            crosstechsolutions • Terminal POS-01
          </p>

          <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold text-slate-200 backdrop-blur-xs">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Role-Differentiated Access Enforcement</span>
          </div>
        </div>

        {/* Role Toggle Switcher */}
        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('cashier');
                setErrorMessage('');
              }}
              className={`btn-press py-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                selectedRole === 'cashier'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CreditCard className={`w-4 h-4 ${selectedRole === 'cashier' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Billing Agent</span>
              <span className="text-[9.5px] font-normal text-slate-400">Cashier Counter</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setErrorMessage('');
              }}
              className={`btn-press py-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                selectedRole === 'admin'
                  ? 'bg-[#1e1e1e] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${selectedRole === 'admin' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Admin / Manager</span>
              <span className="text-[9.5px] font-normal opacity-70">Executive Back Office</span>
            </button>
          </div>

          {/* Role Boundary Notice */}
          <div className={`p-3 rounded-2xl text-xs border ${
            selectedRole === 'cashier'
              ? 'bg-blue-50/70 border-blue-200/80 text-blue-900'
              : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
          }`}>
            <span className="font-bold block mb-0.5">
              {selectedRole === 'cashier' ? 'Cashier Role Policy:' : 'Administrator Role Policy:'}
            </span>
            <p className="text-[11px] leading-relaxed">
              {selectedRole === 'cashier'
                ? 'Authorized for Sales, Cart Checkout, Shift Cash Drawer, Held Orders, and Customer Returns. Profit margins, cost prices, and financial reports are strictly locked.'
                : 'Full executive privileges enabled: Executive Pulse Dashboard, Product Master, Stock Ledger, Shift Audits, Customer Insights, and System Configurations.'}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PIN Login Form */}
          {authMethod === 'ROLE_SELECT' ? (
            <form onSubmit={handlePinSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Enter 4-Digit Security PIN
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="password"
                    maxLength={4}
                    autoFocus
                    required
                    placeholder="••••"
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value)}
                    className="w-full text-center text-2xl font-mono font-extrabold tracking-widest text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-9 pr-4 outline-none focus:border-[#1e1e1e] focus:ring-2 focus:ring-[#1e1e1e]/10 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-press w-full py-3.5 rounded-2xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-brand flex items-center justify-center gap-2 mt-1"
              >
                <span>Login as {selectedRole === 'cashier' ? 'Billing Agent' : 'Store Admin'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Direct Quick Test Login Buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                  Instant Demo Pass (1-Click Login)
                </span>
                {selectedRole === 'cashier' ? (
                  <button
                    type="button"
                    onClick={() => handleRoleQuickLogin(cashierUser)}
                    className="btn-press w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <span>⚡ Quick Login: Rahul Sharma (PIN: 1234)</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRoleQuickLogin(adminUser)}
                      className="btn-press py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                    >
                      Anita Verma (9999)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleQuickLogin(ownerUser)}
                      className="btn-press py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                    >
                      Chandan - Owner (0000)
                    </button>
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* Supabase Cloud Auth Form */
            <form onSubmit={handleSupabaseSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Supabase Cloud Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@crosstech.com"
                  value={supabaseEmail}
                  onChange={(e) => setSupabaseEmail(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={supabasePassword}
                  onChange={(e) => setSupabasePassword(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-press w-full py-3.5 rounded-2xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold shadow-brand flex items-center justify-center gap-2 mt-1"
              >
                <span>{isSubmitting ? 'Authenticating with Supabase...' : 'Sign In with Supabase'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Toggle between PIN Login and Supabase Cloud Auth */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setAuthMethod(authMethod === 'ROLE_SELECT' ? 'EMAIL_SUPABASE' : 'ROLE_SELECT');
                setErrorMessage('');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mx-auto"
            >
              <Database className="w-3.5 h-3.5" />
              <span>
                {authMethod === 'ROLE_SELECT'
                  ? 'Switch to Supabase Cloud Authentication'
                  : 'Switch back to Quick PIN / Role Login'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
