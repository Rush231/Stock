import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Scan, 
  AlertTriangle, 
  Layers, 
  ArrowUpDown, 
  Check, 
  SlidersHorizontal,
  DollarSign,
  Boxes,
  Building2
} from 'lucide-react';
import { Product } from '../types/inventory';
import { Branch } from '../types/branches';

interface InventoryViewProps {
  products: Product[];
  branches: Branch[];
  selectedBranchId: string;
  onOpenScanner: () => void;
  onOpenNewProduct: () => void;
  onQuickAdjust: (product: Product) => void;
  onNavigateLots: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  branches,
  selectedBranchId,
  onOpenScanner,
  onOpenNewProduct,
  onQuickAdjust,
  onNavigateLots,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Extract unique categories
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filter products
  const filteredProducts = products.filter((p) => {
    // Search query matching
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);

    // Category filter
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;

    // Total stock in network or in selected branch
    const totalAvail = selectedBranchId === 'ALL'
      ? p.stocks.reduce((acc, s) => acc + s.available, 0)
      : (p.stocks.find((s) => s.branchId === selectedBranchId)?.available || 0);

    // Low stock filter
    const matchesLowStock = !onlyLowStock || totalAvail <= p.minStock;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortField === 'name') {
      return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortField === 'price') {
      return sortOrder === 'asc' ? a.salePrice - b.salePrice : b.salePrice - a.salePrice;
    }
    if (sortField === 'stock') {
      const stockA = a.stocks.reduce((acc, s) => acc + s.available, 0);
      const stockB = b.stocks.reduce((acc, s) => acc + s.available, 0);
      return sortOrder === 'asc' ? stockA - stockB : stockB - stockA;
    }
    return 0;
  });

  return (
    <div className="space-y-5">
      
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Inventario & Catálogo Central
          </h1>
          <p className="text-xs text-slate-400">
            Control multidepósito, seguimiento de existencias disponibles y sincronización omnicanal
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Scan className="w-4 h-4 text-emerald-400" />
            <span>Escanear Código</span>
          </button>
          <button
            onClick={onNavigateLots}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Trazabilidad por Lotes</span>
          </button>
          <button
            onClick={onOpenNewProduct}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por Nombre, SKU o Código de Barras EAN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todas las Categorías ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Low Stock Toggle */}
          <div className="sm:col-span-3 flex items-center">
            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                onlyLowStock
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Sólo Stock Crítico</span>
            </button>
          </div>

        </div>

        {/* Filter metadata summary */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span>Mostrando {sortedProducts.length} de {products.length} productos</span>
            {selectedBranchId !== 'ALL' && (
              <>
                <span>·</span>
                <span className="text-emerald-400">
                  Filtrado por: {branches.find((b) => b.id === selectedBranchId)?.name}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSortField('name');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="hover:text-slate-200"
            >
              Nombre {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                setSortField('stock');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="hover:text-slate-200"
            >
              Stock {sortField === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                setSortField('price');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="hover:text-slate-200"
            >
              Precio {sortField === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

      </div>

      {/* Main Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="py-3 px-4">Producto & Identificación</th>
                <th className="py-3 px-4">Categoría & Proveedor</th>
                <th className="py-3 px-4 text-right">Costo / Venta</th>
                <th className="py-3 px-4 text-center">Distribución por Sucursal</th>
                <th className="py-3 px-4 text-right">Stock Disponible</th>
                <th className="py-3 px-4 text-center">Ecommerce</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedProducts.map((p) => {
                const totalStock = p.stocks.reduce((acc, s) => acc + s.quantity, 0);
                const totalReserved = p.stocks.reduce((acc, s) => acc + s.reserved, 0);
                const totalAvailable = p.stocks.reduce((acc, s) => acc + s.available, 0);
                const isUnderMin = totalAvailable <= p.minStock;

                return (
                  <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                    
                    {/* Col 1: Product Name, SKU & Barcode */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200 max-w-xs truncate">
                        {p.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-slate-300">{p.sku}</span>
                        <span>·</span>
                        <span className="text-slate-500">{p.barcode}</span>
                        {p.hasLotTracking && (
                          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1 rounded">
                            Lotes
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Col 2: Category & Supplier */}
                    <td className="py-3 px-4">
                      <div className="text-slate-300 font-medium">{p.category}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                        {p.supplierName}
                      </div>
                    </td>

                    {/* Col 3: Cost and Price */}
                    <td className="py-3 px-4 text-right font-mono">
                      <div className="font-bold text-emerald-400">
                        ${p.salePrice.toLocaleString('es-AR')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Costo: ${p.costPrice.toLocaleString('es-AR')}
                      </div>
                    </td>

                    {/* Col 4: Branch Distribution Grid */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {p.stocks.map((st) => (
                          <div
                            key={st.branchId}
                            title={`${st.branchName}: ${st.available} disponibles (${st.reserved} reservados)`}
                            className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300"
                          >
                            <span className="text-slate-500 mr-1">
                              {branches.find((b) => b.id === st.branchId)?.code || 'B'}:
                            </span>
                            <span className={st.available <= 3 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                              {st.available}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Col 5: Total Available Stock & Alert */}
                    <td className="py-3 px-4 text-right font-mono">
                      <div className="flex items-center justify-end gap-1.5">
                        {isUnderMin && (
                          <span title="Por debajo del umbral mínimo">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          </span>
                        )}
                        <span className={`text-sm font-bold ${isUnderMin ? 'text-amber-400' : 'text-slate-100'}`}>
                          {totalAvailable} {p.unit}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Mín: {p.minStock} · Obj: {p.targetStock}
                      </div>
                    </td>

                    {/* Col 6: Ecommerce Sync Status */}
                    <td className="py-3 px-4 text-center">
                      {p.ecommerceSync ? (
                        <div className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          <Check className="w-3 h-3" />
                          <span>SYNC</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-600 font-mono">OFF</span>
                      )}
                    </td>

                    {/* Col 7: Actions */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onQuickAdjust(p)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition-colors"
                      >
                        Ajustar
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
