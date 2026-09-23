import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Building2, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { Branch, InterBranchTransfer, InterBranchTransferItem } from '../types/branches';
import { Product, ProductLot } from '../types/inventory';
import { soundService } from '../services/audioService';

interface TransferStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  products: Product[];
  lots: ProductLot[];
  onCreateTransfer: (newTransfer: Omit<InterBranchTransfer, 'id' | 'remitoNumber' | 'createdDate'>) => void;
}

export const TransferStockModal: React.FC<TransferStockModalProps> = ({
  isOpen,
  onClose,
  branches,
  products,
  lots,
  onCreateTransfer,
}) => {
  const [fromBranchId, setFromBranchId] = useState<string>(branches[2]?.id || branches[0]?.id || '');
  const [toBranchId, setToBranchId] = useState<string>(branches[1]?.id || branches[0]?.id || '');
  const [transportCompany, setTransportCompany] = useState<string>('Flete Express Interno');
  const [driverName, setDriverName] = useState<string>('Esteban Gómez (Camión 04)');
  const [notes, setNotes] = useState<string>('Reposición programada de stock.');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [items, setItems] = useState<InterBranchTransferItem[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      sku: products[0]?.sku || '',
      quantity: 5,
    },
  ]);

  if (!isOpen) return null;

  const fromBranch = branches.find((b) => b.id === fromBranchId) || branches[0];
  const toBranch = branches.find((b) => b.id === toBranchId) || branches[1];

  const handleAddItem = () => {
    const candidate = products.find((p) => !items.some((it) => it.productId === p.id)) || products[0];
    if (candidate) {
      setItems([
        ...items,
        {
          productId: candidate.id,
          productName: candidate.name,
          sku: candidate.sku,
          quantity: 5,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, updates: Partial<InterBranchTransferItem>) => {
    setItems(
      items.map((it, i) => (i === index ? { ...it, ...updates } : it))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fromBranchId === toBranchId) {
      setErrorMsg('El depósito de origen y el de destino deben ser diferentes.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Debe agregar al menos un producto al remito de traslado.');
      return;
    }

    // Check stock availability at origin
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId);
      const bs = prod?.stocks.find((s) => s.branchId === fromBranchId);
      const avail = bs?.available || 0;
      if (avail < item.quantity) {
        setErrorMsg(`Stock insuficiente en ${fromBranch.name} para "${item.productName}". Disponible: ${avail}, Solicitado: ${item.quantity}`);
        return;
      }
    }

    onCreateTransfer({
      fromBranchId,
      fromBranchName: fromBranch.name,
      toBranchId,
      toBranchName: toBranch.name,
      status: 'IN_TRANSIT',
      items,
      transportCompany,
      driverName,
      trackingCode: `FLE-${Math.floor(10000 + Math.random() * 90000)}`,
      createdBy: 'Alejandro Morales (Supervisor)',
      notes,
    });

    soundService.playBarcodeBeep();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Emitir Remito de Traslado entre Sucursales
              </h2>
              <p className="text-xs text-slate-400">
                Despacho interdepósitos con trazabilidad en ruta y custodia de lote
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Route: Origin -> Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Depósito de Origen (Despacho)
              </label>
              <select
                value={fromBranchId}
                onChange={(e) => setFromBranchId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Depósito de Destino (Recepción)
              </label>
              <select
                value={toBranchId}
                onChange={(e) => setToBranchId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.id === fromBranchId}>
                    {b.name} {b.id === fromBranchId ? '(Mismo que origen)' : `(${b.city})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transport Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Empresa de Transporte / Fletero
              </label>
              <input
                type="text"
                required
                value={transportCompany}
                onChange={(e) => setTransportCompany(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Chofer / Patente del Vehículo
              </label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Items to transfer */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">
                Productos a Trasladar:
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Artículo</span>
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {items.map((item, index) => {
                const prod = products.find((p) => p.id === item.productId);
                const bs = prod?.stocks.find((s) => s.branchId === fromBranchId);
                const avail = bs?.available || 0;

                return (
                  <div
                    key={index}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <div className="sm:col-span-5">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const newProd = products.find((p) => p.id === e.target.value);
                          if (newProd) {
                            handleUpdateItem(index, {
                              productId: newProd.id,
                              productName: newProd.name,
                              sku: newProd.sku,
                            });
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded py-1 px-2 text-slate-200 text-xs truncate"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <span className="text-[10px] text-slate-500 block">
                        Disp. en origen: <strong className="text-slate-300">{avail} u.</strong>
                      </span>
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-1">
                      <span className="text-slate-500 text-[10px]">Cant:</span>
                      <input
                        type="number"
                        min="1"
                        max={avail}
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded py-1 px-2 text-white font-mono text-center text-xs"
                      />
                    </div>

                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Observaciones del Remito
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-mono text-[11px]">
              Total a despachar: {items.reduce((acc, it) => acc + it.quantity, 0)} unidades
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={items.length === 0}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg font-semibold shadow-sm"
              >
                Generar Remito y Despachar
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
