import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  Building2,
  Filter,
  Search
} from 'lucide-react';
import { ProductLot, Product } from '../types/inventory';
import { Branch } from '../types/branches';

interface LotTrackingViewProps {
  lots: ProductLot[];
  products: Product[];
  branches: Branch[];
  onUpdateLotStatus: (lotId: string, newStatus: ProductLot['status']) => void;
  onCreateLot: (newLot: Omit<ProductLot, 'id' | 'createdAt'>) => void;
}

export const LotTrackingView: React.FC<LotTrackingViewProps> = ({
  lots,
  products,
  branches,
  onUpdateLotStatus,
  onCreateLot,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New lot form state
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [lotNumber, setLotNumber] = useState<string>('');
  const [mfgDate, setMfgDate] = useState<string>('2026-03-01');
  const [expDate, setExpDate] = useState<string>('2028-03-01');
  const [quantity, setQuantity] = useState<number>(50);
  const [branchId, setBranchId] = useState<string>(branches[0]?.id || 'branch-01');
  const [notes, setNotes] = useState<string>('');

  const filteredLots = lots.filter((lot) => {
    const product = products.find((p) => p.id === lot.productId);
    const matchesSearch =
      lot.lotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (product?.sku.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === 'ALL' || lot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotNumber.trim() || !selectedProductId) return;

    const prod = products.find((p) => p.id === selectedProductId);

    onCreateLot({
      productId: selectedProductId,
      lotNumber: lotNumber.trim().toUpperCase(),
      manufacturingDate: mfgDate,
      expirationDate: expDate,
      initialQuantity: quantity,
      currentQuantity: quantity,
      status: 'ACTIVE',
      branchId,
      supplierId: prod?.supplierId || 'supp-01',
      notes,
    });

    setShowCreateModal(false);
    setLotNumber('');
    setNotes('');
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Trazabilidad & Seguimiento por Lotes
          </h1>
          <p className="text-xs text-slate-400">
            Control FEFO (First-Expired, First-Out), inspección de calidad y monitoreo de vencimientos
          </p>
        </div>

        <button
          onClick={() => {
            setLotNumber(`LOT-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Lote</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Número de Lote (ej: LOT-2026-A12), SKU o Producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Todos los Estados ({lots.length} lotes)</option>
            <option value="ACTIVE">Activos (Disponibles)</option>
            <option value="QUARANTINE">En Cuarentena / Control de Calidad</option>
            <option value="EXPIRED">Vencidos / No aptos</option>
            <option value="DEPLETED">Agotados (Stock 0)</option>
          </select>
        </div>
      </div>

      {/* Lots Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="py-3 px-4">Lote & Producto</th>
                <th className="py-3 px-4">Ubicación / Sucursal</th>
                <th className="py-3 px-4 text-center">Fechas (Elab. / Vencimiento)</th>
                <th className="py-3 px-4 text-right">Cantidad Actual</th>
                <th className="py-3 px-4 text-center">Estado de Calidad</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLots.map((lot) => {
                const prod = products.find((p) => p.id === lot.productId);
                const branch = branches.find((b) => b.id === lot.branchId);

                // Expiry calculation
                const expTime = new Date(lot.expirationDate).getTime();
                const nowTime = Date.now();
                const daysUntilExp = Math.round((expTime - nowTime) / (1000 * 60 * 60 * 24));
                const isNearExpiry = daysUntilExp < 60 && daysUntilExp > 0;
                const isExpired = daysUntilExp <= 0;

                return (
                  <tr key={lot.id} className="hover:bg-slate-850/50 transition-colors">
                    
                    {/* Lot Number & Product Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm text-indigo-400 flex items-center gap-1.5">
                        {lot.lotNumber}
                        {isNearExpiry && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1 rounded font-sans">
                            Vence pronto ({daysUntilExp}d)
                          </span>
                        )}
                      </div>
                      <div className="font-sans font-medium text-slate-200 text-xs mt-0.5 truncate max-w-xs">
                        {prod?.name || 'Producto no identificado'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        SKU: {prod?.sku} · Barras: {prod?.barcode}
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="py-3 px-4 font-sans text-slate-300">
                      <div>{branch?.name || 'Depósito Central'}</div>
                      {lot.notes && (
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">
                          {lot.notes}
                        </div>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4 text-center">
                      <div className="text-slate-200 text-xs">
                        Vence: {lot.expirationDate}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Elaborado: {lot.manufacturingDate}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-white text-sm">
                        {lot.currentQuantity} u.
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Inicial: {lot.initialQuantity} u.
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center font-sans">
                      {lot.status === 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Aprobado
                        </span>
                      )}
                      {lot.status === 'QUARANTINE' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <ShieldAlert className="w-3 h-3" />
                          Cuarentena
                        </span>
                      )}
                      {lot.status === 'EXPIRED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Vencido
                        </span>
                      )}
                      {lot.status === 'DEPLETED' && (
                        <span className="text-[11px] text-slate-500 font-mono">Agotado</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        {lot.status === 'ACTIVE' ? (
                          <button
                            onClick={() => onUpdateLotStatus(lot.id, 'QUARANTINE')}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded text-[11px] font-medium border border-amber-500/30 transition-colors"
                          >
                            A Cuarentena
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateLotStatus(lot.id, 'ACTIVE')}
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-[11px] font-medium border border-emerald-500/30 transition-colors"
                          >
                            Liberar
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Lot */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Registrar Nuevo Lote de Producción / Importación
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Producto Asociado
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Número de Lote (Batch ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    placeholder="LOT-2026-XXXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Cantidad Inicial
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Fecha de Fabricación
                  </label>
                  <input
                    type="date"
                    required
                    value={mfgDate}
                    onChange={(e) => setMfgDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Sucursal de Almacenamiento
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Notas de Inspección / Protocolo
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Aprobado por control de calidad inicial. Embalaje intacto."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Guardar Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
