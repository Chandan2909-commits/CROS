import React from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Clock,
  Trash2,
  PlayCircle,
  X,
  ShoppingBag
} from 'lucide-react';

export function HeldOrdersModal() {
  const {
    activeModal,
    setActiveModal,
    heldOrders,
    recallHeldOrder,
    deleteHeldOrder
  } = usePOS();

  if (activeModal !== 'heldOrders') return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="animate-spring-modal bg-white w-full max-w-lg rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                Held / Parked Orders ({heldOrders.length})
              </h2>
              <span className="text-[11px] font-semibold text-slate-400">
                Recall cart back to active counter
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-2.5 max-h-96 overflow-y-auto">
          {heldOrders.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold text-slate-600">No Orders Currently on Hold</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Use the "Hold" button in the cart panel to park an order</p>
            </div>
          ) : (
            heldOrders.map((held) => (
              <div
                key={held.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900">{held.id}</span>
                    <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                      {held.customer}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {held.items.length} items • Held at {new Date(held.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {held.note && (
                    <div className="text-[10.5px] text-slate-500 italic mt-0.5">
                      "{held.note}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right mr-1">
                    <span className="text-sm font-extrabold font-mono text-slate-900">
                      ₹{held.total.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() => recallHeldOrder(held.id)}
                    className="btn-press px-3 py-2 rounded-xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    title="Load into active cart"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Recall</span>
                  </button>

                  <button
                    onClick={() => deleteHeldOrder(held.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100"
                    title="Discard held order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
