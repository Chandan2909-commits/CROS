import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Users,
  Plus,
  Search,
  ShoppingBag,
  Star,
  Receipt,
  X,
  ArrowRight
} from 'lucide-react';

export function CustomersView() {
  const {
    customers,
    setCustomers,
    salesLedger
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Customer Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCustomer = {
      id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
      name,
      phone: phone || '—',
      email: email || '—',
      totalPurchases: 0,
      totalSpent: 0,
      loyaltyPoints: 10, // Welcome reward bonus
      isDefault: false
    };

    setCustomers(prev => [...prev, newCustomer]);
    setIsAddModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Customer sales history
  const customerSales = selectedCustomer
    ? salesLedger.filter(s => s.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 font-heading">
            Customers & Loyalty Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Default Walk-in customer + registered customer purchase histories and points
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-press px-4 py-2.5 rounded-full bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-brand flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Main Grid: Customer Table + Order History Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Customer Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none"
            />
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 pl-4">Customer Name</th>
                  <th className="py-3">Contact</th>
                  <th className="py-3 text-center">Orders</th>
                  <th className="py-3 text-right">Total Spend</th>
                  <th className="py-3 text-center">Loyalty</th>
                  <th className="py-3 pr-4 text-right">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((c) => {
                  const isSelected = selectedCustomer?.id === c.id;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-slate-100/80' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3 pl-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        {c.isDefault && (
                          <span className="text-[9.5px] font-bold uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                            Default Counter
                          </span>
                        )}
                      </td>

                      <td className="py-3 font-mono text-slate-600 text-[11px]">
                        <div>{c.phone}</div>
                        <div className="text-[10px] text-slate-400">{c.email}</div>
                      </td>

                      <td className="py-3 text-center font-mono font-bold text-slate-800">
                        {c.totalPurchases || 0}
                      </td>

                      <td className="py-3 text-right font-mono font-extrabold text-slate-900">
                        ₹{(c.totalSpent || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          {c.loyaltyPoints || 0} pts
                        </span>
                      </td>

                      <td className="py-3 pr-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(c);
                          }}
                          className="btn-press text-xs font-bold text-blue-600 hover:text-blue-800"
                        >
                          View Invoices →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Customer History Inspection (Section 52 of brain.md) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading">
              Customer Purchase History
            </h3>
            <p className="text-[11px] text-slate-400">
              {selectedCustomer ? `Invoices for ${selectedCustomer.name}` : 'Click a customer to view invoices'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pt-3 flex flex-col gap-2">
            {!selectedCustomer ? (
              <div className="text-center py-12 text-slate-400">
                <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">Select a customer to inspect order history</p>
              </div>
            ) : customerSales.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-xs font-semibold">No recent sales for this customer</p>
              </div>
            ) : (
              customerSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900">{sale.invoiceNumber}</span>
                    <span className="font-mono font-extrabold text-xs text-slate-900">₹{sale.grandTotal}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                    <span>{new Date(sale.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="uppercase font-bold text-slate-600">{sale.paymentMethod}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 border-t border-slate-200/60 pt-1">
                    {sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="animate-spring-modal bg-white w-full max-w-md rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#1e1e1e] text-white flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Register New Customer
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-5 flex flex-col gap-3">
              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98200 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full font-mono text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="ramesh@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                />
              </div>

              <button
                type="submit"
                className="btn-press w-full py-3.5 rounded-2xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-brand mt-2 flex items-center justify-center gap-2"
              >
                <span>Save Customer Record</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
