import React, { useState } from 'react';
import { 
  X, 
  Boxes, 
  Sparkles, 
  Plus, 
  Barcode 
} from 'lucide-react';
import { Product } from '../types/inventory';
import { Branch } from '../types/branches';
import { LocalSupplier } from '../types/suppliers';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  suppliers: LocalSupplier[];
  onSaveProduct: (newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  branches,
  suppliers,
  onSaveProduct,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Herramientas');
  const [costPrice, setCostPrice] = useState(15000);
  const [salePrice, setSalePrice] = useState(25000);
  const [minStock, setMinStock] = useState(15);
  const [targetStock, setTargetStock] = useState(60);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || 'supp-01');
  const [hasLotTracking, setHasLotTracking] = useState(true);
  const [initialQty, setInitialQty] = useState(30);

  if (!isOpen) return null;

  const generateRandomEAN = () => {
    const randomEan = '779' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setBarcode(randomEan);
  };

  const generateRandomSKU = () => {
    const prefix = category.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    setSku(`${prefix}-${randomNum}-X`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;

    const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

    // Allocate initial quantity across branches
    const stocks = branches.map((b, idx) => {
      const share = idx === 0 ? Math.ceil(initialQty * 0.5) : Math.floor(initialQty * 0.25);
      return {
        branchId: b.id,
        branchName: b.name,
        quantity: share,
        reserved: 0,
        available: share,
      };
    });

    onSaveProduct({
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim() || '779' + Math.floor(1000000000 + Math.random() * 9000000000),
      name: name.trim(),
      description: `Producto catalogado: ${name.trim()}`,
      category,
      costPrice: Number(costPrice),
      salePrice: Number(salePrice),
      minStock: Number(minStock),
      targetStock: Number(targetStock),
      unit: 'u',
      hasLotTracking,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      stocks,
      ecommerceSync: true,
      ecommerceMappings: {},
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Registrar Nuevo Producto en Catálogo
              </h2>
              <p className="text-xs text-slate-400">
                Alta con sincronización automática a ecommerce y lector de código de barras
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Nombre Comercial del Producto
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Taladro Percutor Inalámbrico 20V"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">SKU Interno</label>
                <button
                  type="button"
                  onClick={generateRandomSKU}
                  className="text-emerald-400 hover:text-emerald-300 text-[10px] font-semibold"
                >
                  Auto-generar
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="HERR-501-A"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Código de Barras (EAN-13)</label>
                <button
                  type="button"
                  onClick={generateRandomEAN}
                  className="text-emerald-400 hover:text-emerald-300 text-[10px] font-semibold"
                >
                  Auto-generar
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="7798123456789"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Herramientas">Herramientas</option>
                <option value="Protección Personal">Protección Personal</option>
                <option value="Electricidad">Electricidad</option>
                <option value="Medición">Medición</option>
                <option value="Iluminación">Iluminación</option>
                <option value="Accesorios">Accesorios</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Proveedor Local Habitual</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500 truncate"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.leadTimeDays}d)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Precio Costo ($)</label>
              <input
                type="number"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Precio Venta ($)</label>
              <input
                type="number"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Stock Mínimo</label>
              <input
                type="number"
                min="1"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Stock Objetivo</label>
              <input
                type="number"
                min="1"
                value={targetStock}
                onChange={(e) => setTargetStock(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Cant. Inicial Red</label>
              <input
                type="number"
                min="0"
                value={initialQty}
                onChange={(e) => setInitialQty(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="hasLot"
              checked={hasLotTracking}
              onChange={(e) => setHasLotTracking(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0"
            />
            <label htmlFor="hasLot" className="text-slate-300 font-medium cursor-pointer">
              Habilitar trazabilidad obligatoria por número de lote y fecha de vencimiento (FEFO)
            </label>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-sm"
            >
              Guardar en Catálogo
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
