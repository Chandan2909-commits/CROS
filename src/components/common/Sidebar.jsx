import React from 'react';
import { usePOS } from '../../context/POSContext';
import {
  CreditCard,
  LayoutDashboard,
  Package,
  Layers,
  Clock,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Lock,
  LogOut,
  Search
} from 'lucide-react';

export function Sidebar() {
  const {
    activeView,
    setActiveView,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setActiveModal,
    heldOrders,
    currentUser,
    logout,
    setIsCommandPaletteOpen
  } = usePOS();

  const isAdmin = currentUser?.role === 'admin';

  // Role-filtered navigation menu items
  const allNavItems = [
    { id: 'pos', label: 'Billing Counter', icon: CreditCard, roleRequired: 'cashier' },
    { id: 'dashboard', label: 'Executive Pulse', icon: LayoutDashboard, roleRequired: 'admin' },
    { id: 'products', label: 'Product Master', icon: Package, roleRequired: 'admin' },
    { id: 'inventory', label: 'Stock & Ledger', icon: Layers, roleRequired: 'admin' },
    { id: 'shifts', label: 'Shift Drawer', icon: Clock, roleRequired: 'cashier' },
    { id: 'customers', label: 'Customers', icon: Users, roleRequired: 'cashier' },
    { id: 'reports', label: 'Reports Center', icon: BarChart3, roleRequired: 'admin' },
    { id: 'settings', label: 'Store Settings', icon: Settings, roleRequired: 'admin' },
  ];

  const visibleNavItems = allNavItems.filter(item => {
    if (isAdmin) return true; // Admins have full access
    return item.roleRequired === 'cashier'; // Cashiers only get cashier-allowed views
  });

  return (
    <aside
      className={`h-[calc(100vh-5rem)] my-2 ml-4 mr-2 bg-white border border-slate-200/80 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.03)] flex flex-col justify-between py-4 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none z-10 ${
        isSidebarCollapsed ? 'w-16 px-2' : 'w-56 px-3'
      }`}
    >
      {/* Top Nav List */}
      <div className="flex flex-col gap-1.5">
        <div className="px-2 pb-2 mb-1 flex items-center justify-between border-b border-slate-100">
          {!isSidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {isAdmin ? 'Admin Console' : 'Cashier Terminal'}
              </span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors ml-auto"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Spotlight Command Palette (⌘K) Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className={`btn-press w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all text-xs font-semibold mb-1 group shadow-2xs ${
            isSidebarCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Search actions, products & commands (⌘K)"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-700 flex-shrink-0" />
          {!isSidebarCollapsed && (
            <>
              <span className="truncate">Spotlight</span>
              <kbd className="ml-auto px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-500 shadow-2xs">
                ⌘K
              </kbd>
            </>
          )}
        </button>

        <nav className="flex flex-col gap-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`btn-press w-full flex items-center gap-3 px-3 py-2.5 rounded-full font-semibold text-xs transition-all ${
                  isActive
                    ? 'bg-[#1e1e1e] text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)]'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={item.label}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {!isSidebarCollapsed && (
                  <span className="truncate tracking-tight">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {!isAdmin && !isSidebarCollapsed && (
          <div className="mx-2 mt-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[10.5px] text-slate-500 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Admin reports & product editing restricted.</span>
          </div>
        )}
      </div>

      {/* Bottom Quick Tools */}
      <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
        {/* Held Orders Quick Pill */}
        {heldOrders.length > 0 && (
          <button
            onClick={() => setActiveModal('heldOrders')}
            className={`btn-press flex items-center gap-2 p-2.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-bold hover:bg-amber-100 ${
              isSidebarCollapsed ? 'justify-center' : 'px-3'
            }`}
            title="Recall Parked Orders"
          >
            <Clock className="w-4 h-4 text-amber-600" />
            {!isSidebarCollapsed && (
              <>
                <span className="truncate">Held Orders</span>
                <span className="ml-auto bg-amber-500 text-white rounded-full px-1.5 py-0.2 text-[10px]">
                  {heldOrders.length}
                </span>
              </>
            )}
          </button>
        )}

        {/* Process Return Shortcut */}
        <button
          onClick={() => setActiveModal('return')}
          className={`btn-press flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 ${
            isSidebarCollapsed ? 'justify-center' : 'px-3'
          }`}
          title="Process Customer Refund / Return"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          {!isSidebarCollapsed && <span>Refund / Return</span>}
        </button>

        {/* Lock Terminal / Switch User */}
        <button
          onClick={logout}
          className={`btn-press flex items-center gap-2 p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold ${
            isSidebarCollapsed ? 'justify-center' : 'px-3'
          }`}
          title="Lock POS Terminal"
        >
          <LogOut className="w-4 h-4 text-slate-600" />
          {!isSidebarCollapsed && <span>Lock Terminal</span>}
        </button>
      </div>
    </aside>
  );
}
