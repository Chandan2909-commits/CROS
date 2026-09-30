import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { ProductImage, CATEGORY_FALLBACK_IMAGES } from '../../utils/imageHelper';
import {
  Package,
  Plus,
  Search,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
  ArrowRight,
  Filter,
  Globe,
  Sparkles
} from 'lucide-react';

export function ProductMasterView() {
  const {
    products,
    categories,
    saveProduct
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formState, setFormState] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Beverages',
    brand: '',
    unit: 'pcs',
    sellingPrice: '',
    costPrice: '',
    taxRate: '18',
    currentStock: '50',
    minStock: '15',
    image: '',
    trackInventory: true
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormState({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: 'Beverages',
      brand: '',
      unit: 'pcs',
      sellingPrice: '',
      costPrice: '',
      taxRate: '18',
      currentStock: '50',
      minStock: '15',
      image: CATEGORY_FALLBACK_IMAGES.Beverages,
      trackInventory: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormState({
      ...p,
      sellingPrice: String(p.sellingPrice),
      costPrice: String(p.costPrice),
      taxRate: String(p.taxRate),
      currentStock: String(p.currentStock),
      minStock: String(p.minStock)
    });
    setIsModalOpen(true);
  };

  const handleAutoFetchImage = () => {
    const fallback = CATEGORY_FALLBACK_IMAGES[formState.category] || CATEGORY_FALLBACK_IMAGES.Default;
    setFormState(prev => ({
      ...prev,
      image: fallback
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    saveProduct({
      ...(editingProduct ? { id: editingProduct.id } : {}),
      name: formState.name,
      sku: formState.sku,
      barcode: formState.barcode,
      category: formState.category,
      brand: formState.brand,
      unit: formState.unit,
      sellingPrice: Number(formState.sellingPrice),
      costPrice: Number(formState.costPrice),
      taxRate: Number(formState.taxRate),
      currentStock: Number(formState.currentStock),
      minStock: Number(formState.minStock),
      image: formState.image || CATEGORY_FALLBACK_IMAGES[formState.category] || CATEGORY_FALLBACK_IMAGES.Default,
      trackInventory: formState.trackInventory
    });
    setIsModalOpen(false);
  };

  const filtered = products.filter(p => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 font-heading">
            Product Master & Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage SKUs, barcodes, tax rates, margins, and stock tracking
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-press px-4 py-2.5 rounded-full bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-brand flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 relative w-full flex items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-2 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search catalog by name, SKU, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn-press px-3.5 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-[#1e1e1e] text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 pl-4">Product Photo</th>
                <th className="py-3">Title & Brand</th>
                <th className="py-3">SKU / Barcode</th>
                <th className="py-3">Category</th>
                <th className="py-3">Cost</th>
                <th className="py-3">Selling Price</th>
                <th className="py-3">Margin %</th>
                <th className="py-3">Stock Status</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((product) => {
                const margin = product.sellingPrice > 0
                  ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100)
                  : 0;

                const isOutOfStock = product.trackInventory && product.currentStock <= 0;
                const isLowStock = product.trackInventory && product.currentStock <= product.minStock && product.currentStock > 0;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                        <ProductImage
                          src={product.image}
                          alt={product.name}
                          category={product.category}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    <td className="py-3">
                      <div className="font-bold text-slate-900">{product.name}</div>
                      <div className="text-[10.5px] text-slate-400">{product.brand || 'CrossTech'}</div>
                    </td>

                    <td className="py-3 font-mono">
                      <div className="text-slate-800 font-semibold">{product.sku}</div>
                      <div className="text-[10px] text-slate-400">{product.barcode}</div>
                    </td>

                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10.5px] font-semibold">
                        {product.category}
                      </span>
                    </td>

                    <td className="py-3 font-mono text-slate-600">
                      ₹{product.costPrice}
                    </td>

                    <td className="py-3 font-mono font-bold text-slate-900">
                      ₹{product.sellingPrice}
                      {product.taxRate > 0 && (
                        <span className="text-[9.5px] font-normal text-slate-400 block">
                          +{product.taxRate}% GST
                        </span>
                      )}
                    </td>

                    <td className="py-3 font-mono font-bold text-emerald-600">
                      {margin}%
                    </td>

                    <td className="py-3">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> Out of Stock (0)
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Low Stock ({product.currentStock})
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold font-mono text-slate-700">
                          {product.currentStock} {product.unit}s
                        </span>
                      )}
                    </td>

                    <td className="py-3 pr-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="btn-press p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Edit product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="animate-spring-modal bg-white w-full max-w-xl rounded-[28px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1e1e1e] text-white flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                    {editingProduct ? 'Edit Product Master' : 'Add New Product to Master'}
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">
                    High-resolution imagery & automated open-source fallbacks
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 flex flex-col gap-3.5">
              {/* Product Photo & Unsplash Auto Fetch */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0">
                  <ProductImage
                    src={formState.image}
                    alt={formState.name}
                    category={formState.category}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Image URL (Leave empty or click auto-fetch from Unsplash)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formState.image}
                      onChange={(e) => setFormState({ ...formState, image: e.target.value })}
                      className="w-full text-xs font-mono bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAutoFetchImage}
                      className="btn-press px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold whitespace-nowrap flex items-center gap-1 hover:bg-blue-100"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Fetch Image</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="e.g. Coca Cola 750ml"
                    className="w-full text-xs font-semibold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Category
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 p-2 rounded-xl border border-slate-200 outline-none"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.sku}
                    onChange={(e) => setFormState({ ...formState, sku: e.target.value })}
                    className="w-full font-mono text-xs font-semibold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Barcode (EAN/UPC) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.barcode}
                    onChange={(e) => setFormState({ ...formState, barcode: e.target.value })}
                    className="w-full font-mono text-xs font-semibold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Cost Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formState.costPrice}
                    onChange={(e) => setFormState({ ...formState, costPrice: e.target.value })}
                    className="w-full font-mono text-xs font-semibold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formState.sellingPrice}
                    onChange={(e) => setFormState({ ...formState, sellingPrice: e.target.value })}
                    className="w-full font-mono text-xs font-semibold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    GST Tax %
                  </label>
                  <select
                    value={formState.taxRate}
                    onChange={(e) => setFormState({ ...formState, taxRate: e.target.value })}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 p-2 rounded-xl border border-slate-200 outline-none"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% (Essential)</option>
                    <option value="12">12% (Standard)</option>
                    <option value="18">18% (Standard FMCG)</option>
                    <option value="28">28% (Luxury / Aerated)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formState.currentStock}
                    onChange={(e) => setFormState({ ...formState, currentStock: e.target.value })}
                    className="w-full font-mono text-xs font-semibold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Low Stock Alert Level
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.minStock}
                    onChange={(e) => setFormState({ ...formState, minStock: e.target.value })}
                    className="w-full font-mono text-xs font-semibold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-press w-full py-3.5 rounded-2xl bg-[#1e1e1e] hover:bg-[#111111] text-white text-xs font-bold shadow-brand flex items-center justify-center gap-2 mt-2"
              >
                <span>{editingProduct ? 'Update Product' : 'Create Product Master Record'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
