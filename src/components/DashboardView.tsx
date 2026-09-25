import React from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Boxes, 
  DollarSign, 
  ShoppingCart, 
  Clock, 
  ArrowRight
} from 'lucide-react';
import { Product, StockMovement, RestockAlert } from '../types/inventory';
import { Branch, InterBranchTransfer } from '../types/branches';
import { EcommerceIntegration } from '../types/ecommerce';
import { SalesTrendDataPoint, InventoryValuationMetric } from '../types/analytics';

interface DashboardViewProps {
  products: Product[];
  valuation: InventoryValuationMetric;
  restockAlerts: RestockAlert[];
  movements: StockMovement[];
  transfers: InterBranchTransfer[];
  ecommerce: EcommerceIntegration[];
  branches: Branch[];
  salesTrends: SalesTrendDataPoint[];
  selectedBranchId: string;
  onOpenNewPO: (preselectedProductId?: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  valuation,
  restockAlerts,
  movements,
  transfers,
  ecommerce,
  branches,
  salesTrends,
  selectedBranchId,
  onOpenNewPO,
  onNavigateTab,
}) => {
  const currentBranch = branches.find((b) => b.id === selectedBranchId);
  const activeTransfersCount = transfers.filter((t) => t.status === 'IN_TRANSIT').length;

  // Filter products and movements if a specific branch is selected
  const filteredProducts = selectedBranchId === 'ALL'
    ? products
    : products.filter((p) => p.stocks.some((s) => s.branchId === selectedBranchId));

  const totalFilteredUnits = filteredProducts.reduce((acc, p) => {
    if (selectedBranchId === 'ALL') {
      return acc + p.stocks.reduce((sAcc, s) => sAcc + s.quantity, 0);
    }
    const bs = p.stocks.find((s) => s.branchId === selectedBranchId);
    return acc + (bs ? bs.quantity : 0);
  }, 0);

  const todayRevenue = 11646500; // Simulated today total
  const connectedEcomCount = ecommerce.filter((e) => e.status === 'CONNECTED').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              {selectedBranchId === 'ALL' ? 'Panel de Control Central' : currentBranch?.name}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
              En Vivo
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Sincronización activa con {connectedEcomCount} canales de ecommerce · Monitoreo de stock y puntos de venta
          </p>
        </div>

        <span className="text-[11px] text-slate-500">Última actualización: ahora</span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Valuation */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Valuación de Stock</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              ${(valuation.totalInventoryRetailValue / 1000000).toFixed(2)}M
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>Costo: ${(valuation.totalInventoryCost / 1000000).toFixed(2)}M</span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">+49% margen</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Inventory Volume */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Unidades Físicas</span>
            <Boxes className="w-4 h-4 text-blue-400" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {totalFilteredUnits.toLocaleString('es-AR')}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>{filteredProducts.length} SKUs activos</span>
              <span>·</span>
              <span className="font-mono text-slate-300">Rotación: {valuation.turnoverRatio}x</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Today's Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Ventas de Hoy (Omnicanal)</span>
            <ShoppingCart className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              ${(todayRevenue / 1000000).toFixed(2)}M
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="text-cyan-400 font-medium">55% Ecommerce</span>
              <span>·</span>
              <span>45% Salones POS</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Replenishment Alerts */}
        <div 
          onClick={() => onNavigateTab('suppliers')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl space-y-2 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Alertas de Reabastecimiento</span>
            <AlertTriangle className={`w-4 h-4 ${restockAlerts.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-2">
              <span className={restockAlerts.length > 0 ? 'text-amber-400' : 'text-slate-400'}>
                {restockAlerts.length}
              </span>
              <span className="text-xs font-normal text-slate-400">artículos críticos</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-amber-300 transition-colors">
              <span>{activeTransfersCount} traslados en viaje</span>
              <ArrowRight className="w-3 h-3 ml-auto" />
            </div>
          </div>
        </div>

      </div>

      {/* Critical Replenishment Alert Banner */}
      {restockAlerts.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-xs font-bold text-amber-200 tracking-tight">
                Alertas Automáticas de Reorden ({restockAlerts.length} productos por debajo del stock de seguridad)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('suppliers')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>Ver gestión con proveedores locales</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {restockAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5 truncate mr-2">
                  <div className="text-xs font-medium text-slate-200 truncate">
                    {alert.productName}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="font-mono text-amber-400 font-bold">
                      {alert.currentTotalStock} u.
                    </span>
                    <span>(Mín: {alert.minStock})</span>
                    <span>·</span>
                    <span className="text-slate-300 truncate">{alert.supplierName}</span>
                  </div>
                </div>
                <button
                  onClick={() => onOpenNewPO(alert.productId)}
                  className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold shrink-0 transition-colors whitespace-nowrap"
                >
                  Pedir (+{alert.suggestedReorder})
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Sales Trends & Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Trends Interactive Chart (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Tendencia de Ventas & Proyección de Demanda (Últimos 7 días)
              </h3>
              <p className="text-xs text-slate-400">
                Comparativa de facturación omnicanal: Canales Digitales vs Puntos de Venta Físicos
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                Ecommerce
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                POS Sucursales
              </span>
            </div>
          </div>

          {/* Bar Chart Representation with Tabular Tooltips */}
          <div className="space-y-3 pt-4">
            <div className="h-48 flex items-end gap-2 sm:gap-4 border-b border-slate-800 pb-2">
              {salesTrends.map((d, idx) => {
                const maxVal = 14000000;
                const ecomHeight = Math.round((d.ecommerceSales / maxVal) * 100);
                const posHeight = Math.round((d.physicalSales / maxVal) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                    
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-16 bg-slate-800 text-white text-[10px] p-2 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap z-20">
                      <div className="font-bold text-slate-200">{d.date}</div>
                      <div>Total: ${(d.totalRevenue / 1000000).toFixed(2)}M</div>
                      <div className="text-cyan-300">Ecom: ${(d.ecommerceSales / 1000000).toFixed(2)}M</div>
                      <div className="text-emerald-300">POS: ${(d.physicalSales / 1000000).toFixed(2)}M</div>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Ecom Bar */}
                      <div
                        style={{ height: `${ecomHeight}%` }}
                        className="w-1/2 bg-cyan-500/80 hover:bg-cyan-400 rounded-t transition-all"
                      />
                      {/* POS Bar */}
                      <div
                        style={{ height: `${posHeight}%` }}
                        className="w-1/2 bg-emerald-500/80 hover:bg-emerald-400 rounded-t transition-all"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-full">
                      {d.date.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Promedio diario: $10.1M</span>
              <span>Margen bruto medio: 49.1%</span>
              <span>Cobertura de inventario restante: 24 días</span>
            </div>
          </div>
        </div>

        {/* Live Channel Status & Warehouses (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Canales & Sincronización
            </h3>
            <button
              onClick={() => onNavigateTab('ecommerce')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Configurar
            </button>
          </div>

          <div className="space-y-3">
            {ecommerce.map((ec) => (
              <div
                key={ec.id}
                className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-200">
                    {ec.storeName}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Sync c/{ec.syncIntervalMinutes}m</span>
                    <span>·</span>
                    <span>{ec.totalSyncedProducts} prods</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
            ))}
          </div>

          {/* Quick link to POS performance */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => onNavigateTab('pos_reports')}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <span>Ver Rendimiento por Punto de Venta</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

        </div>

      </div>

      {/* Recent Movements Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Movimientos Recientes de Stock (Trazabilidad en Tiempo Real)
            </h3>
            <p className="text-xs text-slate-400">
              Registro auditado de ventas POS, ecommerce, remitos de traslado y recepciones de proveedor
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Ver catálogo completo
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 pr-4">Fecha / Hora</th>
                <th className="pb-3 px-4">Tipo Movimiento</th>
                <th className="pb-3 px-4">Producto & SKU</th>
                <th className="pb-3 px-4 text-right">Cantidad</th>
                <th className="pb-3 px-4">Sucursal / Destino</th>
                <th className="pb-3 px-4">Lote / Referencia</th>
                <th className="pb-3 pl-4">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {movements.slice(0, 7).map((m) => {
                const isPositive = m.quantity > 0;
                return (
                  <tr key={m.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(m.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-sans text-[11px] font-semibold ${
                        m.type === 'RECEPTION' ? 'text-blue-400' :
                        m.type === 'ECOMMERCE_SALE' ? 'text-cyan-400' :
                        m.type === 'POS_SALE' ? 'text-amber-400' :
                        'text-purple-400'
                      }`}>
                        {m.type === 'RECEPTION' && 'Recepción Proveedor'}
                        {m.type === 'ECOMMERCE_SALE' && 'Venta Online'}
                        {m.type === 'POS_SALE' && 'Venta POS Mostrador'}
                        {m.type === 'TRANSFER_OUT' && 'Despacho Traslado'}
                        {m.type === 'TRANSFER_IN' && 'Ingreso Traslado'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-sans font-medium text-slate-200 truncate max-w-xs">
                        {m.productName}
                      </div>
                      <div className="text-[10px] text-slate-400">{m.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {isPositive ? `+${m.quantity}` : m.quantity} u.
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 truncate max-w-[160px]">
                      {m.branchName}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] truncate">
                      {m.lotNumber ? <span className="text-emerald-400">{m.lotNumber}</span> : m.referenceId || '—'}
                    </td>
                    <td className="py-3 pl-4 font-sans text-slate-400 truncate max-w-[120px]">
                      {m.performedBy}
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
