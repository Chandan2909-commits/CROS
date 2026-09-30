import React from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Topbar } from './components/common/Topbar';
import { Sidebar } from './components/common/Sidebar';
import { CommandPalette } from './components/common/CommandPalette';
import { LoginScreen } from './components/auth/LoginScreen';
import { BillingScreen } from './components/pos/BillingScreen';
import { CheckoutModal } from './components/pos/CheckoutModal';
import { ReceiptModal } from './components/pos/ReceiptModal';
import { ShiftModals } from './components/pos/ShiftModals';
import { ReturnModal } from './components/pos/ReturnModal';
import { HeldOrdersModal } from './components/pos/HeldOrdersModal';
import { DashboardView } from './components/admin/DashboardView';
import { ProductMasterView } from './components/admin/ProductMasterView';
import { InventoryView } from './components/admin/InventoryView';
import { ShiftAuditView } from './components/admin/ShiftAuditView';
import { CustomersView } from './components/admin/CustomersView';
import { ReportsView } from './components/admin/ReportsView';
import { SettingsView } from './components/admin/SettingsView';

import { SupabaseModal } from './components/common/SupabaseModal';

function AppContent() {
  const { activeView, isAuthenticated, currentUser } = usePOS();

  // If not logged in, show dedicated role-based login gate
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f8f9fa] overflow-hidden select-none">
      {/* 1. Sticky Floating Topbar */}
      <Topbar />

      {/* 2. Macro Body: Sidebar + Dynamic Main View */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* View Router with Role Protection */}
        <div className="flex-1 flex overflow-hidden">
          {activeView === 'pos' && <BillingScreen />}
          {isAdmin && activeView === 'dashboard' && <DashboardView />}
          {isAdmin && activeView === 'products' && <ProductMasterView />}
          {isAdmin && activeView === 'inventory' && <InventoryView />}
          {activeView === 'shifts' && <ShiftAuditView />}
          {activeView === 'customers' && <CustomersView />}
          {isAdmin && activeView === 'reports' && <ReportsView />}
          {isAdmin && activeView === 'settings' && <SettingsView />}
        </div>
      </div>

      {/* 3. Global Modal Architecture (Spring Physics & Backdrop blur) */}
      <CheckoutModal />
      <ReceiptModal />
      <ShiftModals />
      <ReturnModal />
      <HeldOrdersModal />
      <SupabaseModal />
      <CommandPalette />
    </div>
  );
}

export default function App() {
  return (
    <POSProvider>
      <AppContent />
    </POSProvider>
  );
}
