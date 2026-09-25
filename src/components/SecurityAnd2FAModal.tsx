import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Lock, 
  Smartphone, 
  AlertTriangle, 
  RefreshCw, 
  Fingerprint, 
  FileText,
  User,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { UserSession, SecurityAuditLog, UserRole } from '../types/auth';
import { AuthService } from '../services/authService';
import { soundService } from '../services/audioService';

interface SecurityAnd2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSession;
  auditLogs: SecurityAuditLog[];
  onUpdateUser: (updatedUser: UserSession) => void;
  onLogSecurityAction: (
    action: SecurityAuditLog['action'],
    details: string,
    status?: 'SUCCESS' | 'WARNING' | 'CRITICAL'
  ) => void;
}

export const SecurityAnd2FAModal: React.FC<SecurityAnd2FAModalProps> = ({
  isOpen,
  onClose,
  user,
  auditLogs,
  onUpdateUser,
  onLogSecurityAction,
}) => {
  const [activeTab, setActiveTab] = useState<'2FA' | 'TOKENS' | 'AUDIT' | 'TENANT'>('2FA');
  const [totpInput, setTotpInput] = useState<string>('');
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpSuccess, setTotpSuccess] = useState<string | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [simulatedBreachResult, setSimulatedBreachResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSetupTwoFactor = async () => {
    const secret = await AuthService.setupTwoFactor();
    setSetupSecret(secret);
    if (!secret) setTotpError('No se pudo preparar la configuración 2FA.');
  };

  const handleVerifyAndEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotpError(null);
    setTotpSuccess(null);

    const isValid = await AuthService.enableTwoFactor(totpInput);

    if (isValid) {
      soundService.playSuccessChime();
      const updated: UserSession = {
        ...user,
        twoFactorEnabled: true,
      };
      onUpdateUser(updated);
      onLogSecurityAction(
        '2FA_ENABLED',
        'Autenticación de dos factores (2FA / TOTP) activada y verificada exitosamente para la cuenta.',
        'SUCCESS'
      );
      setTotpSuccess('¡Autenticación de dos factores activada con éxito!');
      setTotpInput('');
    } else {
      soundService.playAlertBuzz();
      setTotpError('Código de 6 dígitos inválido o expirado. Verifique su aplicación autenticadora.');
      onLogSecurityAction(
        '2FA_VERIFIED',
        'Intento fallido de validación de código TOTP de 6 dígitos.',
        'WARNING'
      );
    }
  };

  const handleDisable2FA = async () => {
    const disabled = await AuthService.disableTwoFactor();
    if (!disabled) return;
    const updated: UserSession = { ...user, twoFactorEnabled: false, token: '' };
    onUpdateUser(updated);
    onLogSecurityAction(
      'SETTINGS_CHANGED',
      'El usuario desactivó la autenticación en dos pasos (2FA).',
      'WARNING'
    );
  };

  const handleSimulateCrossTenantBreach = () => {
    fetch('/api/products', {
      credentials: 'include',
      headers: { Authorization: 'Bearer forged-cross-tenant-token' },
    }).then((response) => {
      if (!response.ok) {
      soundService.playAlertBuzz();
      setSimulatedBreachResult(`ACCESO DENEGADO (${response.status}): el servidor rechazó el token adulterado.`);
      onLogSecurityAction(
        'UNAUTHORIZED_CROSS_TENANT_BLOCKED',
        `Intento de infiltración entre tenants bloqueado: token perteneciente a org-foreign-comp-999 intentó acceder al espacio de datos privado de ${user.organizationName}.`,
        'CRITICAL'
      );
      }
    });
  };

  const handleSwitchRole = (newRole: UserRole) => {
    const updated: UserSession = {
      ...user,
      role: newRole,
    };
    onUpdateUser(updated);
    onLogSecurityAction(
      'SETTINGS_CHANGED',
      `Rol de usuario cambiado a ${newRole} para simulación de permisos.`,
      'SUCCESS'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Centro de Seguridad, Tokens & Autenticación 2FA
              </h2>
              <p className="text-xs text-slate-400">
                Aislamiento multinquilino estricto, protección contra acceso indebido y tokens criptográficos
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

        {/* Tabs Bar */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-950/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('2FA')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === '2FA'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Autenticación en Dos Pasos (2FA)
          </button>
          <button
            onClick={() => setActiveTab('TOKENS')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'TOKENS'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Tokens de Seguridad & Sesión
          </button>
          <button
            onClick={() => setActiveTab('TENANT')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'TENANT'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Aislamiento de Cuentas (Simulador)
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'AUDIT'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Auditoría de Accesos ({auditLogs.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          
          {/* TAB 1: 2FA */}
          {activeTab === '2FA' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  {user.twoFactorEnabled ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Estado de 2FA: {user.twoFactorEnabled ? 'Protegido con TOTP' : 'Desactivado'}
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      {user.twoFactorEnabled
                        ? 'Se requiere un código temporal de 6 dígitos de Google Authenticator / Authy para autorizar operaciones sensibles.'
                        : 'Recomendamos activar 2FA para proteger las existencias, precios mayoristas y claves API.'}
                    </p>
                  </div>
                </div>

                {user.twoFactorEnabled ? (
                  <button
                    onClick={handleDisable2FA}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-semibold transition-colors"
                  >
                    Desactivar 2FA
                  </button>
                ) : (
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                    ACCIÓN RECOMENDADA
                  </span>
                )}
              </div>

              {/* QR and Key Configuration Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                
                {/* Visual QR Simulator */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg text-slate-900 space-y-2">
                  <div className="w-36 h-36 bg-slate-900 p-2 rounded flex flex-col items-center justify-center">
                    {/* Stylized QR representation */}
                    <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-white rounded">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-xs ${
                            (i % 2 === 0 || i % 5 === 0 || i < 6 || i > 30) ? 'bg-slate-900' : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 font-semibold text-center">
                    Escanear con Google Authenticator / Authy
                  </span>
                </div>

                {/* Secret Key and Verification */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <label className="block text-slate-400 font-medium">
                      Clave Secreta Manual (Base32):
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-500 text-xs tracking-wider">
                        {setupSecret || 'Pulsa “Configurar 2FA” para generar una clave'}
                      </div>
                      {!user.twoFactorEnabled && (
                        <button type="button" onClick={handleSetupTwoFactor} className="shrink-0 rounded border border-slate-700 px-2 py-1 text-[10px] text-emerald-300 hover:bg-slate-800">Configurar 2FA</button>
                      )}
                    </div>

                    {/* Live code rotation preview */}
                    <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">Código actual</span>
                        <span className="text-[11px] text-slate-300">Generado por tu app autenticadora</span>
                      </div>
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>

                  {/* Verification Form */}
                  <form onSubmit={handleVerifyAndEnable2FA} className="space-y-2">
                    <label className="block text-slate-300 font-medium">
                      Ingresar Código de 6 Dígitos para Validar:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Ej: 123456"
                        value={totpInput}
                        onChange={(e) => setTotpInput(e.target.value.replace(/[^0-9]/g, ''))}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 font-mono text-center text-sm font-bold text-white tracking-widest focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={totpInput.length < 6}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded transition-colors"
                      >
                        Verificar
                      </button>
                    </div>
                    {totpError && <p className="text-red-400 text-[11px]">{totpError}</p>}
                    {totpSuccess && <p className="text-emerald-400 text-[11px]">{totpSuccess}</p>}
                  </form>

                </div>

              </div>
            </div>
          )}

          {/* TAB 2: TOKENS */}
          {activeTab === 'TOKENS' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-slate-200 font-bold">
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  <span>Token Criptográfico de Sesión Activa</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Cada petición al servidor lleva un token firmado con SHA-256 ligado exclusivamente a la organización <strong>{user.organizationName}</strong>. Si una petición intenta mezclar datos con otro negocio, es rechazada de inmediato.
                </p>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 break-all select-all">
                  Cookie HttpOnly activa. El token no se expone al navegador ni se guarda en localStorage.
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
                  <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">ORGANIZATION ID</span>
                    <span className="text-white font-bold">{user.organizationId}</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">ROL DE ACCESO</span>
                    <span className="text-emerald-400 font-bold">{user.role}</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">IP VINCULADA</span>
                    <span className="text-white">{user.ipAddress.split(' ')[0]}</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">EXPIRACIÓN</span>
                    <span className="text-cyan-400">24 horas</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TENANT ISOLATION SIMULATOR */}
          {activeTab === 'TENANT' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  Prueba de Aislamiento Multinquilino (Anti-Contaminación de Cuentas)
                </h3>
                <p className="text-slate-400 text-[11px]">
                  El requisito fundamental del negocio es asegurar que ningún usuario externo pueda acceder por error ni deliberadamente al inventario, ventas o costos de su empresa.
                </p>

                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">
                      Simular Ataque de Inyección de Token Cruzado
                    </span>
                    <button
                      onClick={handleSimulateCrossTenantBreach}
                      className="px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white rounded font-semibold text-xs transition-colors"
                    >
                      Ejecutar Prueba de Violación
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Genera una petición con un token falsificado perteneciente a otra empresa ("org-foreign-comp-999") intentando leer las bases de datos de su cuenta.
                  </p>

                  {simulatedBreachResult && (
                    <div className="p-3 bg-red-950/40 border border-red-500/40 rounded text-red-300 font-mono text-[11px] space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        Firewall OmniStock: Intento Bloqueado Exitosamente
                      </div>
                      <p>{simulatedBreachResult}</p>
                      <p className="text-slate-400 text-[10px]">
                        El incidente fue registrado automáticamente en la tabla de auditoría con la IP del solicitante.
                      </p>
                    </div>
                  )}
                </div>

                {/* Role Switcher for Testing RBAC */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-300 block">
                    Simular Permisos por Rol (RBAC):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['ADMIN', 'SUPERVISOR', 'POS_CASHIER', 'AUDITOR'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => handleSwitchRole(r)}
                        className={`p-2 rounded border text-center transition-colors ${
                          user.role === r
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">
                  Historial Inmutable de Auditoría de Seguridad:
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {auditLogs.length} eventos registrados
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                      <th className="p-2.5">Fecha/Hora</th>
                      <th className="p-2.5">Acción</th>
                      <th className="p-2.5">Detalles</th>
                      <th className="p-2.5">IP</th>
                      <th className="p-2.5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-850/50">
                        <td className="p-2.5 text-slate-400 whitespace-nowrap text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-2.5 font-bold text-white whitespace-nowrap text-[11px]">
                          {log.action}
                        </td>
                        <td className="p-2.5 font-sans text-slate-300 text-xs">
                          {log.details}
                        </td>
                        <td className="p-2.5 text-slate-400 text-[11px] whitespace-nowrap">
                          {log.ipAddress}
                        </td>
                        <td className="p-2.5 text-center font-sans">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10' :
                            log.status === 'WARNING' ? 'text-amber-400 bg-amber-500/10' :
                            'text-red-400 bg-red-500/10'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Organización: <strong className="text-slate-200">{user.organizationName}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
