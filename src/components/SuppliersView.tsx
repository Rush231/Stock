import React, { useState } from 'react';
import { 
  Truck, 
  Store, 
  Plus, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  FileText, 
  Sparkles, 
  ArrowRight,
  PackageCheck,
  Building2,
  ExternalLink
} from 'lucide-react';
import { LocalSupplier, PurchaseOrder } from '../types/suppliers';
import { Product, RestockAlert } from '../types/inventory';
import { Branch } from '../types/branches';
import confetti from 'canvas-confetti';
import { soundService } from '../services/audioService';

interface SuppliersViewProps {
  suppliers: LocalSupplier[];
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  branches: Branch[];
  restockAlerts: RestockAlert[];
  onOpenCreatePO: (preselectedProductId?: string) => void;
  onUpdatePOStatus: (poId: string, newStatus: PurchaseOrder['status']) => void;
  onReceivePO: (po: PurchaseOrder) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  purchaseOrders,
  products,
  branches,
  restockAlerts,
  onOpenCreatePO,
  onUpdatePOStatus,
  onReceivePO,
}) => {
  const [activeTab, setActiveTab] = useState<'POS' | 'SUPPLIERS' | 'SUGGESTIONS'>('POS');

  const handleReceiveClick = (po: PurchaseOrder) => {
    onReceivePO(po);
    soundService.playSuccessChime();
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10b981', '#f59e0b', '#3b82f6'],
    });
  };

  const handleSendWhatsApp = (po: PurchaseOrder) => {
    const supp = suppliers.find((s) => s.id === po.supplierId);
    if (!supp) return;

    const itemsText = po.items
      .map((i) => `• ${i.quantity}x ${i.productName} (SKU: ${i.sku}) - $${i.subtotal.toLocaleString('es-AR')}`)
      .join('%0A');

    const message = `Hola ${supp.contactName}, le enviamos la Orden de Compra oficial *${po.orderNumber}* de OmniStock Nexus.%0A%0A*Detalle del pedido:*%0A${itemsText}%0A%0A*Total:* $${po.totalAmount.toLocaleString('es-AR')}%0A*Destino:* ${po.destinationBranchName}%0A*Fecha estimada de entrega requerida:* ${po.expectedDeliveryDate}%0A%0APor favor confirme recepción. ¡Muchas gracias!`;

    const cleanPhone = supp.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    onUpdatePOStatus(po.id, 'SENT');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-400" />
            Proveedores Locales & Órdenes de Compra
          </h1>
          <p className="text-xs text-slate-400">
            Optimización de tiempos de reposición (24h/48h), despacho por WhatsApp y recepción con control de lotes
          </p>
        </div>

        <button
          onClick={() => onOpenCreatePO()}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Generar Orden de Compra</span>
        </button>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('POS')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'POS'
              ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Órdenes de Compra ({purchaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('SUGGESTIONS')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'SUGGESTIONS'
              ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Sugerencias de Reposición ({restockAlerts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'SUPPLIERS'
              ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Directorio de Proveedores ({suppliers.length})
        </button>
      </div>

      {/* Tab 1: Active Purchase Orders */}
      {activeTab === 'POS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchaseOrders.map((po) => {
              const supp = suppliers.find((s) => s.id === po.supplierId);
              return (
                <div
                  key={po.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">
                          {po.orderNumber}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          po.status === 'RECEIVED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                          po.status === 'CONFIRMED' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                          po.status === 'SENT' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                          'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          {po.status === 'RECEIVED' && 'MERCADERÍA RECIBIDA'}
                          {po.status === 'CONFIRMED' && 'CONFIRMADA / EN PREPARACIÓN'}
                          {po.status === 'SENT' && 'ENVIADA A PROVEEDOR'}
                          {po.status === 'DRAFT' && 'BORRADOR'}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        ${po.totalAmount.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="text-slate-200 font-medium">
                        Proveedor: {po.supplierName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>Destino: {po.destinationBranchName}</span>
                        <span>·</span>
                        <span>Entrega: {po.expectedDeliveryDate}</span>
                      </div>
                    </div>

                    {/* Items table preview */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 space-y-1 text-xs">
                      {po.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-300">
                          <span className="truncate max-w-[200px]">{it.quantity}x {it.productName}</span>
                          <span className="font-mono text-slate-400">${it.subtotal.toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>

                    {po.assignedLotNumber && (
                      <div className="text-[11px] text-indigo-400 font-mono flex items-center gap-1">
                        <span>Lote asignado para recepción:</span>
                        <span className="font-bold">{po.assignedLotNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {po.status !== 'RECEIVED' && (
                        <button
                          onClick={() => handleSendWhatsApp(po)}
                          className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      )}
                    </div>

                    {po.status !== 'RECEIVED' ? (
                      <button
                        onClick={() => handleReceiveClick(po)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Recibir en Stock</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Ingresado el {po.receivedDate ? new Date(po.receivedDate).toLocaleDateString() : 'hoy'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Suggestions & Auto Reorder */}
      {activeTab === 'SUGGESTIONS' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-1">
              Cálculo Automático de Reabastecimiento Óptimo (Lead Time Demand + Stock de Seguridad)
            </h3>
            <p className="text-xs text-slate-400">
              El motor algorítmico evalúa el stock disponible actual, la tasa de venta diaria y el tiempo de respuesta del proveedor local para recomendar la reposición antes del quiebre.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restockAlerts.map((alert) => {
              const supp = suppliers.find((s) => s.id === alert.supplierId);
              return (
                <div
                  key={alert.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                        alert.urgency === 'HIGH' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                        alert.urgency === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                        'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      }`}>
                        URGENCIA {alert.urgency}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Lead time: {alert.estimatedLeadDays}d
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white">
                      {alert.productName}
                    </h4>

                    <div className="grid grid-cols-3 gap-2 p-2 bg-slate-950/60 rounded-lg text-center text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Actual</span>
                        <span className="text-amber-400 font-bold">{alert.currentTotalStock}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Mínimo</span>
                        <span className="text-slate-300">{alert.minStock}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Sugerido</span>
                        <span className="text-emerald-400 font-bold">+{alert.suggestedReorder}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Proveedor asignado: <span className="text-slate-200">{alert.supplierName}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenCreatePO(alert.productId)}
                    className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>Generar Orden para {alert.suggestedReorder} u.</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Directory of Local Suppliers */}
      {activeTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {s.name}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono">
                    CUIT: {s.cuit} · {s.city}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {s.deliveryReliabilityScore}% Eficacia
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 bg-slate-950/60 p-2.5 rounded-lg">
                <div>
                  <span className="text-slate-500 text-[10px] block">Tiempo de Entrega</span>
                  <span className="font-bold text-amber-400">
                    {s.leadTimeDays === 1 ? '24 horas (Inmediato)' : `${s.leadTimeDays} días`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Pedido Mínimo</span>
                  <span>${s.minimumOrderAmount.toLocaleString('es-AR')}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Condición de Pago</span>
                  <span>{s.paymentTerms}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Rubro</span>
                  <span className="font-sans text-slate-200">{s.category}</span>
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
                <span>Contacto: {s.contactName} ({s.phone})</span>
                <button
                  onClick={() => onOpenCreatePO()}
                  className="text-amber-400 hover:text-amber-300 font-semibold"
                >
                  Crear O.C. →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
