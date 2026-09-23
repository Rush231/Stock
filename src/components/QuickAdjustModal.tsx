import React, { useState } from 'react';
import { X, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { Product } from '../types/inventory';
import { Branch } from '../types/branches';

interface QuickAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  branches: Branch[];
  selectedBranchId: string;
  onConfirmAdjust: (
    productId: string,
    branchId: string,
    newQuantity: number,
    reason: string
  ) => void;
}

export const QuickAdjustModal: React.FC<QuickAdjustModalProps> = ({
  isOpen,
  onClose,
  product,
  branches,
  selectedBranchId,
  onConfirmAdjust,
}) => {
  const [branchId, setBranchId] = useState<string>(
    selectedBranchId === 'ALL' ? branches[0]?.id || '' : selectedBranchId
  );
  const [newQty, setNewQty] = useState<number>(0);
  const [reason, setReason] = useState<string>('Ajuste por conteo físico cíclico');

  if (!isOpen || !product) return null;

  const currentBranchStock = product.stocks.find((s) => s.branchId === branchId);
  const currentAvailable = currentBranchStock?.available || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmAdjust(product.id, branchId, newQty, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Ajuste Rápido de Stock Físico
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
          <div className="font-bold text-slate-200">{product.name}</div>
          <div className="text-[11px] font-mono text-slate-400">
            SKU: {product.sku} · EAN: {product.barcode}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Sucursal a Ajustar
            </label>
            <select
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                const s = product.stocks.find((st) => st.branchId === e.target.value);
                setNewQty(s?.available || 0);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">Stock Registrado</span>
              <span className="text-sm font-bold text-slate-300">{currentAvailable} u.</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">Nuevo Recuento Físico</span>
              <input
                type="number"
                min="0"
                value={newQty}
                onChange={(e) => setNewQty(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Motivo del Ajuste (Auditoría obligatoria)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200"
            >
              <option value="Ajuste por conteo físico cíclico">Ajuste por conteo físico cíclico</option>
              <option value="Merma o rotura en depósito">Merma o rotura en depósito</option>
              <option value="Diferencia de inventario en mostrador">Diferencia de inventario en mostrador</option>
              <option value="Devolución de cliente sin ticket">Devolución de cliente sin ticket</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold"
            >
              Confirmar Ajuste
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
