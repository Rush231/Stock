import React, { useState } from 'react';
import { 
  X, 
  Store, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  Check, 
  Phone
} from 'lucide-react';
import { LocalSupplier, PurchaseOrder, PurchaseOrderItem } from '../types/suppliers';
import { Product } from '../types/inventory';
import { Branch } from '../types/branches';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: LocalSupplier[];
  products: Product[];
  branches: Branch[];
  preselectedProductId?: string;
  onCreatePO: (newPO: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt'>) => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  products,
  branches,
  preselectedProductId,
  onCreatePO,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [destinationBranchId, setDestinationBranchId] = useState<string>(branches[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [dispatchMethod, setDispatchMethod] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [notes, setNotes] = useState<string>('');

  // Items in order
  const [items, setItems] = useState<PurchaseOrderItem[]>(() => {
    if (preselectedProductId) {
      const prod = products.find((p) => p.id === preselectedProductId);
      if (prod) {
        return [
          {
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            quantity: Math.max(10, prod.targetStock - prod.stocks.reduce((acc, s) => acc + s.available, 0)),
            unitCost: prod.costPrice,
            subtotal: prod.costPrice * Math.max(10, prod.targetStock - prod.stocks.reduce((acc, s) => acc + s.available, 0)),
          },
        ];
      }
    }
    const firstProd = products[0];
    return firstProd
      ? [
          {
            productId: firstProd.id,
            productName: firstProd.name,
            sku: firstProd.sku,
            quantity: 20,
            unitCost: firstProd.costPrice,
            subtotal: firstProd.costPrice * 20,
          },
        ]
      : [];
  });

  if (!isOpen) return null;

  const currentSupplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
  const currentBranch = branches.find((b) => b.id === destinationBranchId) || branches[0];
  const totalAmount = items.reduce((acc, it) => acc + it.subtotal, 0);

  const handleAddItem = () => {
    const candidate = products.find((p) => !items.some((it) => it.productId === p.id)) || products[0];
    if (candidate) {
      setItems([
        ...items,
        {
          productId: candidate.id,
          productName: candidate.name,
          sku: candidate.sku,
          quantity: 10,
          unitCost: candidate.costPrice,
          subtotal: candidate.costPrice * 10,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, updates: Partial<PurchaseOrderItem>) => {
    setItems(
      items.map((it, i) => {
        if (i !== index) return it;
        const updated = { ...it, ...updates };
        updated.subtotal = updated.quantity * updated.unitCost;
        return updated;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    onCreatePO({
      supplierId: currentSupplier.id,
      supplierName: currentSupplier.name,
      destinationBranchId: currentBranch.id,
      destinationBranchName: currentBranch.name,
      status: 'CONFIRMED',
      items,
      totalAmount,
      expectedDeliveryDate: expectedDate,
      dispatchMethod,
      notes,
      assignedLotNumber: `LOT-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Nueva Orden de Compra (Reposición Local)
              </h2>
              <p className="text-xs text-slate-400">
                Genera la orden formal, calcula costos y programa la recepción con lote asignado
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Proveedor Local
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.leadTimeDays}d entrega · {s.city})
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-amber-400 mt-1 font-mono">
                Lead Time: {currentSupplier.leadTimeDays} día(s) · Min: ${currentSupplier.minimumOrderAmount.toLocaleString('es-AR')}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Sucursal / Depósito de Destino
              </label>
              <select
                value={destinationBranchId}
                onChange={(e) => setDestinationBranchId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Fecha Estimada de Recepción
              </label>
              <input
                type="date"
                required
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Canal de Notificación al Proveedor
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchMethod('WHATSAPP')}
                  className={`py-2 px-3 rounded-lg border text-center font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    dispatchMethod === 'WHATSAPP'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                      : 'bg-slate-950 border-slate-700 text-slate-400'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDispatchMethod('EMAIL')}
                  className={`py-2 px-3 rounded-lg border text-center font-semibold transition-colors ${
                    dispatchMethod === 'EMAIL'
                      ? 'bg-blue-500/15 border-blue-500/50 text-blue-400'
                      : 'bg-slate-950 border-slate-700 text-slate-400'
                  }`}
                >
                  Email Formal
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">
                Líneas de la Orden de Compra:
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Producto</span>
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {items.map((item, index) => (
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
                            unitCost: newProd.costPrice,
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

                  <div className="sm:col-span-3 flex items-center gap-1">
                    <span className="text-slate-500 text-[10px]">Cant:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(index, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded py-1 px-2 text-white font-mono text-center text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3 font-mono text-right text-emerald-400 font-bold">
                    ${item.subtotal.toLocaleString('es-AR')}
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
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Instrucciones Especiales para el Proveedor
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Entregar por rampa de descarga de 8:00 a 12:00hs con remito duplicado."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Footer Total */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">Total Estimado O.C.</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                ${totalAmount.toLocaleString('es-AR')}
              </span>
            </div>

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
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg font-semibold shadow-sm"
              >
                Emitir Orden de Compra
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
