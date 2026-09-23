import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Store, 
  TrendingUp, 
  CreditCard, 
  QrCode, 
  Banknote, 
  AlertOctagon, 
  UserCheck, 
  ArrowUpRight,
  Printer
} from 'lucide-react';
import { POSMetric } from '../types/analytics';
import { Branch } from '../types/branches';

interface POSPerformanceViewProps {
  metrics: POSMetric[];
  branches: Branch[];
}

export const POSPerformanceView: React.FC<POSPerformanceViewProps> = ({
  metrics,
  branches,
}) => {
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');

  const filteredMetrics = selectedBranchFilter === 'ALL'
    ? metrics
    : metrics.filter((m) => m.branchId === selectedBranchFilter);

  const totalPOSRevenue = filteredMetrics.reduce((acc, m) => acc + m.todayRevenue, 0);
  const totalPOSTransactions = filteredMetrics.reduce((acc, m) => acc + m.todayTransactions, 0);
  const avgOverallTicket = totalPOSTransactions > 0 ? Math.round(totalPOSRevenue / totalPOSTransactions) : 0;
  const totalStockouts = filteredMetrics.reduce((acc, m) => acc + m.stockoutIncidents, 0);

  const handleExportCSV = () => {
    const headers = 'Sucursal,Facturacion_Hoy,Transacciones,Ticket_Promedio,Cajero_Asignado,Efectivo_Pct,Tarjeta_Pct,QR_Pct,Quiebres_Stock\n';
    const rows = filteredMetrics
      .map(
        (m) =>
          `"${m.branchName}",${m.todayRevenue},${m.todayTransactions},${m.averageTicket},"${m.cashierName}",${m.paymentBreakdown.cashPercentage}%,${m.paymentBreakdown.cardPercentage}%,${m.paymentBreakdown.qrTransferPercentage}%,${m.stockoutIncidents}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_rendimiento_pos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Informes de Rendimiento por Punto de Venta (POS) en Tiempo Real
          </h1>
          <p className="text-xs text-slate-400">
            Métricas de facturación en mostrador, ticket promedio, mix de cobro y quiebres de inventario
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Todas las Cajas ({metrics.length} sucursales)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Facturación Física Hoy</span>
          <div className="text-2xl font-bold font-mono text-white">
            ${totalPOSRevenue.toLocaleString('es-AR')}
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2% vs misma hora ayer</span>
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Tickets / Transacciones</span>
          <div className="text-2xl font-bold font-mono text-white">
            {totalPOSTransactions} ventas
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {filteredMetrics.length} terminales conectadas
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Ticket Promedio Global</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ${avgOverallTicket.toLocaleString('es-AR')}
          </div>
          <span className="text-[11px] text-slate-400">
            3.2 unidades por cliente
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Incidentes de Quiebre</span>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {totalStockouts}
          </div>
          <span className="text-[11px] text-slate-400">
            Consultas sin stock en salón
          </span>
        </div>
      </div>

      {/* Detailed Per-Branch POS Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {filteredMetrics.map((item) => (
          <div
            key={item.branchId}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              
              {/* Branch Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {item.branchName}
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Operador: <strong className="text-slate-200">{item.cashierName}</strong></span>
                  </div>
                </div>

                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  TURNO ACTIVO
                </span>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">Facturado</span>
                  <span className="text-base font-bold text-white">
                    ${item.todayRevenue.toLocaleString('es-AR')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">Ticket Medio</span>
                  <span className="text-base font-bold text-emerald-400">
                    ${item.averageTicket.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Payment Methods Split */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Distribución de Medios de Cobro:
                </span>
                
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${item.paymentBreakdown.cardPercentage}%` }}
                    className="bg-cyan-500"
                    title={`Tarjetas: ${item.paymentBreakdown.cardPercentage}%`}
                  />
                  <div
                    style={{ width: `${item.paymentBreakdown.qrTransferPercentage}%` }}
                    className="bg-purple-500"
                    title={`QR / Transferencia: ${item.paymentBreakdown.qrTransferPercentage}%`}
                  />
                  <div
                    style={{ width: `${item.paymentBreakdown.cashPercentage}%` }}
                    className="bg-emerald-500"
                    title={`Efectivo: ${item.paymentBreakdown.cashPercentage}%`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    Tarjetas: {item.paymentBreakdown.cardPercentage}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    QR: {item.paymentBreakdown.qrTransferPercentage}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Efectivo: {item.paymentBreakdown.cashPercentage}%
                  </span>
                </div>
              </div>

              {/* Hourly Sales Mini-histogram */}
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Curva Horaria de Ventas (Turno de Hoy):
                </span>
                <div className="h-16 flex items-end gap-1.5 pt-2">
                  {item.hourlySales.map((h, hIdx) => {
                    const maxH = 650000;
                    const heightPct = Math.min(100, Math.round((h.sales / maxH) * 100));
                    return (
                      <div key={hIdx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full bg-emerald-500/70 hover:bg-emerald-400 rounded-t transition-all"
                          title={`${h.hour}: $${h.sales.toLocaleString('es-AR')} (${h.transactions} tkts)`}
                        />
                        <span className="text-[9px] font-mono text-slate-500">{h.hour.split(':')[0]}h</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Selling Products at this POS */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300 block">
                  Top Artículos en Mostrador:
                </span>
                <div className="space-y-1.5 text-xs">
                  {item.topSellingProducts.map((p, pIdx) => (
                    <div key={pIdx} className="flex justify-between items-center text-slate-300">
                      <span className="truncate max-w-[170px] text-[11px]">{p.unitsSold}x {p.name}</span>
                      <span className="font-mono text-[11px] text-emerald-400 font-medium">
                        ${p.revenue.toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Quiebre de stock alert footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <AlertOctagon className={`w-3.5 h-3.5 ${item.stockoutIncidents > 0 ? 'text-amber-400' : 'text-slate-600'}`} />
                <span>Quiebres de stock: <strong className="text-slate-200">{item.stockoutIncidents}</strong></span>
              </span>
              <span className="font-mono text-[10px] text-slate-500">Live sync</span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
