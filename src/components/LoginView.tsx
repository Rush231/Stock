import React, { FormEvent, useState } from 'react';
import { AlertCircle, ArrowRight, KeyRound, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { AuthService } from '../services/authService';

interface LoginViewProps {
  onAuthenticated: () => Promise<void>;
}

export const LoginView: React.FC<LoginViewProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        const result = await AuthService.register(name, organizationName, email, password);
        if (!result.success) {
          setError(result.error || 'No se pudo crear la cuenta.');
          return;
        }
        await onAuthenticated();
        return;
      }
      const result = await AuthService.login(email, password, requiresTwoFactor ? totpCode : undefined);
      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setError('Ingresa el código de tu aplicación autenticadora para continuar.');
        return;
      }
      if (!result.success) {
        setError(result.error || 'No pudimos iniciar sesión. Verifica tus datos.');
        return;
      }
      await onAuthenticated();
    } catch {
      setError('No se pudo conectar con el servidor. Comprueba que el backend esté iniciado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-white">OmniStock Nexus</p>
            <p className="text-xs text-slate-400">Operaciones de inventario</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Acceso seguro</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">{isRegistering ? 'Crea tu cuenta' : 'Inicia sesión'}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">{isRegistering ? 'Crea tu organización y empieza a gestionar tu inventario.' : 'Accede al inventario de tu organización con tus credenciales corporativas.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <>
                <label className="block space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Nombre</span>
                  <input type="text" required value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400" placeholder="Tu nombre" />
                </label>
                <label className="block space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Organización</span>
                  <input type="text" required value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400" placeholder="Nombre de tu empresa" />
                </label>
              </>
            )}
            <label className="block space-y-2">
              <span className="text-xs font-semibold text-slate-300">Correo electrónico</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400"
                placeholder="nombre@empresa.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold text-slate-300">Contraseña</span>
              <input
                type="password"
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                minLength={isRegistering ? 12 : undefined}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400"
                placeholder="Tu contraseña"
              />
            </label>

            {requiresTwoFactor && (
              <label className="block space-y-2">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <KeyRound className="h-3.5 w-3.5 text-emerald-400" /> Código de autenticación
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={totpCode}
                  onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-center font-mono text-lg tracking-[0.35em] text-white outline-none transition focus:border-emerald-400"
                  placeholder="000000"
                />
              </label>
            )}

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {isRegistering ? 'Crear cuenta' : requiresTwoFactor ? 'Verificar y entrar' : 'Continuar'}
            </button>
          </form>

          <button type="button" onClick={() => { setIsRegistering(!isRegistering); setRequiresTwoFactor(false); setError(null); }} className="mt-5 w-full text-center text-xs font-semibold text-emerald-400 hover:text-emerald-300">
            {isRegistering ? 'Ya tengo una cuenta' : 'Crear una cuenta nueva'}
          </button>

          <div className="mt-6 flex items-center gap-2 border-t border-slate-800 pt-5 text-[11px] text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Sesión protegida por cookie HttpOnly y verificación de organización.</span>
          </div>
        </div>
      </section>
    </main>
  );
};
