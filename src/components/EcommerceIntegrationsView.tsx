import React, { useState } from 'react';
import { 
  ShoppingBag, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Sliders, 
  Clock, 
  AlertCircle,
  Play,
  Layers,
  ArrowDownRight
} from 'lucide-react';
import { EcommerceIntegration, EcommerceSyncEvent } from '../types/ecommerce';
import { Product } from '../types/inventory';
import { Branch } from '../types/branches';
import confetti from 'canvas-confetti';
import { soundService } from '../services/audioService';

interface EcommerceIntegrationsViewProps {
  integrations: EcommerceIntegration[];
  syncEvents: EcommerceSyncEvent[];
  products: Product[];
  branches: Branch[];
  onTriggerFullSync: () => void;
  isSyncing: boolean;
  onSimulateEcommerceSale: (
    platform: EcommerceIntegration['platform'],
    productId: string,
    quantity: number
  ) => void;
  onToggleAutoDeduct: (integrationId: string) => void;
  onUpdateBuffer: (integrationId: string, newBuffer: number) => void;
}

export const EcommerceIntegrationsView: React.FC<EcommerceIntegrationsViewProps> = ({
  integrations,
  syncEvents,
  products,
  branches,
  onTriggerFullSync,
  isSyncing,
  onSimulateEcommerceSale,
  onToggleAutoDeduct,
  onUpdateBuffer,
}) => {
  const [selectedSimPlatform, setSelectedSimPlatform] = useState<EcommerceIntegration['platform']>('MERCADOLIBRE');
  const [selectedSimProduct, setSelectedSimProduct] = useState<string>(products[0]?.id || '');
  const [simQty, setSimQty] = useState<number>(1);

  const handleSimulateSale = () => {
    if (!selectedSimProduct) return;
    onSimulateEcommerceSale(selectedSimPlatform, selectedSimProduct, simQty);
    soundService.playSuccessChime();
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#06b6d4', '#10b981', '#3b82f6'],
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
            Integración Automatizada con Plataformas de Ecommerce
          </h1>
          <p className="text-xs text-slate-400">
            Sincronización bidireccional de inventario en tiempo real, webhooks y buffers de seguridad
          </p>
        </div>

        <button
          onClick={onTriggerFullSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Sincronizando red...' : 'Forzar Sincronización Omnicanal'}</span>
        </button>
      </div>

      {/* Interactive Platform Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrations.map((item) => {
          const warehouse = branches.find((b) => b.id === item.assignedWarehouseBranchId);
          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                    item.platform === 'MERCADOLIBRE' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    item.platform === 'SHOPIFY' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    item.platform === 'TIENDANUBE' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                    'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  }`}>
                    {item.platform}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-[11px] font-medium">CONECTADO</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {item.storeName}
                  </h3>
                  <a
                    href={item.storeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 truncate"
                  >
                    <span className="truncate">{item.storeUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                {/* Technical Configuration */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Depósito asignado:</span>
                    <span className="text-slate-200 truncate max-w-[120px] font-sans">
                      {warehouse?.name || 'General'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Intervalo de sync:</span>
                    <span>Cada {item.syncIntervalMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SKUs publicados:</span>
                    <span className="text-white font-bold">{item.totalSyncedProducts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Buffer reserva:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={item.safetyStockBuffer}
                        onChange={(e) => onUpdateBuffer(item.id, parseInt(e.target.value) || 0)}
                        className="w-12 bg-slate-950 border border-slate-700 rounded px-1 text-center text-xs text-white"
                      />
                      <span className="text-[10px] text-slate-500">u.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggle Auto Deduct */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Descarga automática:</span>
                <button
                  onClick={() => onToggleAutoDeduct(item.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    item.autoDeductStockOnSale
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.autoDeductStockOnSale ? 'ACTIVADO' : 'MANUAL'}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Simulator: Incoming Ecommerce Order Engine */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Simulador de Venta Online & Webhook en Vivo
            </h3>
            <p className="text-xs text-slate-400">
              Pruebe cómo el SaaS procesa una venta aprobada en Shopify o Mercado Libre, descontando stock en tiempo real y emitiendo el log
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            Ambiente Sandbox
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          
          <div className="sm:col-span-3">
            <label className="block text-xs text-slate-400 font-medium mb-1">
              Canal de Venta
            </label>
            <select
              value={selectedSimPlatform}
              onChange={(e) => setSelectedSimPlatform(e.target.value as EcommerceIntegration['platform'])}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="MERCADOLIBRE">Mercado Libre Full</option>
              <option value="SHOPIFY">Shopify Plus</option>
              <option value="TIENDANUBE">Tiendanube</option>
              <option value="WOOCOMMERCE">WooCommerce B2B</option>
            </select>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs text-slate-400 font-medium mb-1">
              Producto Vendido
            </label>
            <select
              value={selectedSimProduct}
              onChange={(e) => setSelectedSimProduct(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 truncate"
            >
              {products.map((p) => {
                const totalAvail = p.stocks.reduce((acc, s) => acc + s.available, 0);
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {totalAvail} u.)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-400 font-medium mb-1">
              Cantidad
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={simQty}
              onChange={(e) => setSimQty(parseInt(e.target.value) || 1)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              onClick={handleSimulateSale}
              className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Disparar Venta</span>
            </button>
          </div>

        </div>
      </div>

      {/* Live Sync Events Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Registro de Eventos y Webhooks de Ecommerce en Tiempo Real
            </h3>
            <p className="text-xs text-slate-400">
              Traza de eventos HTTP, descuentos de inventario y respuestas de APIs externas
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {syncEvents.length} eventos registrados
          </span>
        </div>

        <div className="space-y-2">
          {syncEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start sm:items-center gap-3">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                  evt.platform === 'MERCADOLIBRE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  evt.platform === 'SHOPIFY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  evt.platform === 'TIENDANUBE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  'bg-purple-500/10 text-purple-400 border-purple-500/20'
                }`}>
                  {evt.platform}
                </span>

                <div className="space-y-0.5">
                  <div className="text-slate-200 font-medium">
                    {evt.message}
                  </div>
                  {evt.payloadSummary && (
                    <div className="text-[11px] text-slate-400 font-mono">
                      {evt.payloadSummary}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 font-mono text-slate-400 text-[11px] justify-between sm:justify-end">
                {evt.quantityDelta && (
                  <span className="font-bold text-amber-400">
                    {evt.quantityDelta} u.
                  </span>
                )}
                <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                  200 OK
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
