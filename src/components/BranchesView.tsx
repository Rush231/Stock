import React, { useState } from 'react';
import { 
  Building2, 
  Truck, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileText,
  Boxes,
  Users,
  Printer
} from 'lucide-react';
import { Branch, InterBranchTransfer } from '../types/branches';
import { Product } from '../types/inventory';
import confetti from 'canvas-confetti';
import { soundService } from '../services/audioService';

interface BranchesViewProps {
  branches: Branch[];
  transfers: InterBranchTransfer[];
  products: Product[];
  onOpenNewTransfer: () => void;
  onReceiveTransfer: (transferId: string) => void;
}

export const BranchesView: React.FC<BranchesViewProps> = ({
  branches,
  transfers,
  products,
  onOpenNewTransfer,
  onReceiveTransfer,
}) => {
  const [activeTab, setActiveTab] = useState<'BRANCHES' | 'TRANSFERS'>('BRANCHES');
  const [selectedTransferForPrint, setSelectedTransferForPrint] = useState<InterBranchTransfer | null>(null);

  const handleReceive = (transferId: string) => {
    onReceiveTransfer(transferId);
    soundService.playSuccessChime();
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#10b981', '#6366f1'],
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Gestión Multidepósito & Traslados entre Sucursales
          </h1>
          <p className="text-xs text-slate-400">
            Sincronización en la nube de depósitos físicos, remitos de transporte y conciliación de inventario
          </p>
        </div>

        <button
          onClick={onOpenNewTransfer}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Generar Remito de Traslado</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('BRANCHES')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'BRANCHES'
              ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Red de Sucursales ({branches.length})
        </button>
        <button
          onClick={() => setActiveTab('TRANSFERS')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'TRANSFERS'
              ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Remitos y Traslados ({transfers.length})</span>
        </button>
      </div>

      {/* Tab 1: Branches Overview */}
      {activeTab === 'BRANCHES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((b) => {
            // Compute real aggregated units from products state
            const branchUnits = products.reduce((acc, p) => {
              const bs = p.stocks.find((s) => s.branchId === b.id);
              return acc + (bs ? bs.quantity : 0);
            }, 0);

            const branchAvailable = products.reduce((acc, p) => {
              const bs = p.stocks.find((s) => s.branchId === b.id);
              return acc + (bs ? bs.available : 0);
            }, 0);

            return (
              <div
                key={b.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {b.code}
                      </span>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {b.name}
                      </h3>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{b.address}, {b.city}</span>
                    </div>
                  </div>

                  {b.isMainHub && (
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      HUB PRINCIPAL
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans">Stock Físico</span>
                    <span className="text-sm font-bold text-white">{branchUnits.toLocaleString('es-AR')} u.</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans">Disponible Venta</span>
                    <span className="text-sm font-bold text-emerald-400">{branchAvailable.toLocaleString('es-AR')} u.</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans">Cajas POS</span>
                    <span className="text-sm font-bold text-cyan-400">{b.activePosCount} activas</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Responsable: <strong className="text-slate-300 font-medium">{b.manager}</strong></span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">{b.phone}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Inter-Branch Transfers & Remitos */}
      {activeTab === 'TRANSFERS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {transfers.map((tr) => (
              <div
                key={tr.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">
                          {tr.remitoNumber}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          tr.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                          tr.status === 'IN_TRANSIT' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {tr.status === 'COMPLETED' ? 'ENTREGADO / CONCILIADO' : 'EN VIAJE / EN TRÁNSITO'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Despachado: {new Date(tr.createdDate).toLocaleString()} · Emitido por {tr.createdBy}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTransferForPrint(tr)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Ver / Imprimir Remito</span>
                    </button>
                    {tr.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => handleReceive(tr.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar Recepción</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Origin to Destination Route */}
                <div className="flex items-center gap-3 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Origen</span>
                    <span className="font-semibold text-slate-200">{tr.fromBranchName}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Destino</span>
                    <span className="font-semibold text-slate-200">{tr.toBranchName}</span>
                  </div>
                  <div className="hidden sm:block text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Transportista</span>
                    <span className="text-slate-300 font-mono">{tr.transportCompany} ({tr.trackingCode})</span>
                  </div>
                </div>

                {/* Items in Transfer */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Artículos amparados en este traslado ({tr.items.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {tr.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-slate-950 border border-slate-800 rounded flex justify-between items-center"
                      >
                        <div className="truncate mr-2">
                          <span className="text-slate-200 font-medium truncate block">
                            {item.productName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            SKU: {item.sku} {item.lotNumber && `· ${item.lotNumber}`}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-white shrink-0">
                          {item.quantity} u.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {tr.notes && (
                  <p className="text-[11px] text-slate-400 italic">
                    Observaciones: {tr.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printable Remito Voucher Modal */}
      {selectedTransferForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 font-sans text-xs">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  REMITO OFICIAL DE TRASLADO INTERNO
                </h2>
                <div className="font-mono text-slate-600 text-xs">
                  {selectedTransferForPrint.remitoNumber}
                </div>
                <div className="text-[11px] text-slate-500">
                  OmniStock Nexus Logistics · CUIT 30-71889923-4
                </div>
              </div>
              <button
                onClick={() => setSelectedTransferForPrint(null)}
                className="text-slate-400 hover:text-slate-800 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border text-[11px]">
              <div>
                <strong>Punto de Partida (Origen):</strong>
                <p>{selectedTransferForPrint.fromBranchName}</p>
              </div>
              <div>
                <strong>Punto de Llegada (Destino):</strong>
                <p>{selectedTransferForPrint.toBranchName}</p>
              </div>
              <div>
                <strong>Transportista:</strong>
                <p>{selectedTransferForPrint.transportCompany || 'Flete Interno'}</p>
              </div>
              <div>
                <strong>Chofer / Vehículo:</strong>
                <p>{selectedTransferForPrint.driverName || 'No informado'}</p>
              </div>
            </div>

            <table className="w-full text-left border">
              <thead>
                <tr className="bg-slate-100 border-b text-slate-700">
                  <th className="p-2">SKU</th>
                  <th className="p-2">Descripción del Producto</th>
                  <th className="p-2">Lote</th>
                  <th className="p-2 text-right">Cant.</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono">
                {selectedTransferForPrint.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2">{it.sku}</td>
                    <td className="p-2 font-sans">{it.productName}</td>
                    <td className="p-2 text-emerald-700">{it.lotNumber || '—'}</td>
                    <td className="p-2 text-right font-bold">{it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t text-center text-[10px] text-slate-500">
              <div className="border-t border-slate-300 pt-2">
                Firma y Aclaración Despachante
              </div>
              <div className="border-t border-slate-300 pt-2">
                Firma y Sello de Recepción Conforme
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold"
              >
                Imprimir Documento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
