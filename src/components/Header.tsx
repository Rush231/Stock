import React, { useState } from 'react';
import { 
  Scan, 
  ShieldCheck, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Building2, 
  Bell, 
  RefreshCw,
  LogOut,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { Branch } from '../types/branches';
import { UserSession } from '../types/auth';
import { soundService } from '../services/audioService';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  user: UserSession;
  onOpenSecurityModal: () => void;
  onOpenScannerModal: () => void;
  lowStockCount: number;
  isSyncing: boolean;
  onQuickSync: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  branches,
  selectedBranchId,
  onSelectBranch,
  user,
  onOpenSecurityModal,
  onOpenScannerModal,
  lowStockCount,
  isSyncing,
  onQuickSync,
  soundEnabled,
  onToggleSound,
  onLogout,
}) => {
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const currentBranch = branches.find((b) => b.id === selectedBranchId);

  const navItems = [
    { id: 'dashboard', label: 'Tablero Principal' },
    { id: 'inventory', label: 'Inventario & Catálogo' },
    { id: 'lots', label: 'Lotes & Vencimientos' },
    { id: 'ecommerce', label: 'Ecommerce & Sync' },
    { id: 'suppliers', label: 'Proveedores & O.C.' },
    { id: 'branches', label: 'Sucursales & Traslados' },
    { id: 'pos_reports', label: 'Rendimiento POS' },
  ];
  const primaryNavItems = navItems.slice(0, 2);
  const secondaryNavItems = navItems.slice(2);

  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      {/* Top Bar Contract: 3 zones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black tracking-wider">
              Ω
            </div>
            <a 
              href="#dashboard" 
              onClick={(e) => { e.preventDefault(); onTabChange('dashboard'); }}
              className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors"
            >
              OmniStock Nexus
            </a>
          </div>

          {/* Zone 2: Navigation Links (single line, subtle hover) */}
          <nav className="hidden lg:flex items-center gap-1">
            {primaryNavItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors relative ${
                    isActive 
                      ? 'text-emerald-400 bg-emerald-500/10 font-semibold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {item.label}
                  {item.id === 'dashboard' && lowStockCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded">
                      {lowStockCount}
                    </span>
                  )}
                </button>
              );
            })}
            <select
              aria-label="Más secciones"
              value={secondaryNavItems.some((item) => item.id === currentTab) ? currentTab : ''}
              onChange={(event) => event.target.value && onTabChange(event.target.value)}
              className="px-2.5 py-1.5 bg-transparent text-xs font-medium text-slate-400 border-0 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 hover:text-slate-200 cursor-pointer"
            >
              <option value="" disabled>Más secciones</option>
              {secondaryNavItems.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </nav>

          {/* Zone 3: Primary Actions & Branch Selector & Security */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Branch Selector Dropdown */}
            <div className="relative inline-flex items-center">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                aria-label="Seleccionar sucursal"
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer hover:border-slate-600 transition-colors max-w-35 sm:max-w-45 truncate"
              >
                <option value="ALL">Todas las Sucursales (Red)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>

            {/* Quick Barcode Scanner Button */}
            <button
              onClick={onOpenScannerModal}
              title="Abrir Lector de Código de Barras (Cámara / Láser)"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-950/40 transition-colors whitespace-nowrap active:scale-95"
            >
              <Scan className="w-4 h-4" />
              <span className="hidden sm:inline">Lector Barcode</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsQuickMenuOpen((isOpen) => !isOpen)}
                aria-label="Más acciones"
                aria-expanded={isQuickMenuOpen}
                className="min-h-11 min-w-11 rounded-lg border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors flex items-center justify-center"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {isQuickMenuOpen && (
                <div className="absolute right-0 top-14 z-40 w-56 rounded-lg border border-slate-700 bg-slate-900 p-1.5 shadow-xl">
                  <button
                    onClick={() => { onQuickSync(); setIsQuickMenuOpen(false); }}
                    disabled={isSyncing}
                    className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-emerald-300 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sincronizar ecommerce
                  </button>
                  <button
                    onClick={() => { onToggleSound(); setIsQuickMenuOpen(false); }}
                    className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    Sonido {soundEnabled ? 'activado' : 'desactivado'}
                  </button>
                </div>
              )}
            </div>

            {/* Security & 2FA / Tenant Status */}
            <button
              onClick={onOpenSecurityModal}
              title={`Seguridad 2FA: ${user.twoFactorEnabled ? 'Protegido' : 'No configurado'} · Tenant: ${user.organizationName}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/80 text-xs text-slate-300 transition-colors"
            >
              {user.twoFactorEnabled ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              )}
              <span className="hidden md:inline font-mono text-[11px] text-slate-400">
                2FA {user.twoFactorEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="min-h-11 min-w-11 rounded-lg border border-slate-800 text-slate-400 hover:border-red-500/40 hover:text-red-300 transition-colors flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="flex lg:hidden items-center overflow-x-auto py-2 gap-1 border-t border-slate-800/80 no-scrollbar">
          {primaryNavItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
                  isActive 
                    ? 'text-emerald-400 bg-emerald-500/10 font-semibold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <select
            aria-label="Más secciones"
            value={secondaryNavItems.some((item) => item.id === currentTab) ? currentTab : ''}
            onChange={(event) => event.target.value && onTabChange(event.target.value)}
            className="shrink-0 px-2.5 py-1 bg-transparent text-xs font-medium text-slate-400 border-0 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="" disabled>Más</option>
            {secondaryNavItems.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </div>

      </div>
    </header>
  );
};
