export class AuthService {
  public static async login(email: string, password: string, totpCode?: string): Promise<{ success: boolean; requiresTwoFactor: boolean; error?: string }> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, ...(totpCode ? { totpCode } : {}) }),
    });
    const payload = await response.json().catch(() => ({}));
    return {
      success: response.ok,
      requiresTwoFactor: payload.twoFactorRequired === true,
      error: typeof payload.error === 'string'
        ? payload.error
        : response.status >= 500
          ? 'El servidor no está disponible. Inicia el backend Flask en el puerto 5000.'
          : response.status === 401
            ? 'Correo o contraseña incorrectos.'
            : 'No se pudo iniciar sesión.',
    };
  }

  public static async register(name: string, organizationName: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, organizationName, email, password }),
    });
    const payload = await response.json().catch(() => ({}));
    return { success: response.ok, error: typeof payload.error === 'string' ? payload.error : 'No se pudo crear la cuenta.' };
  }

  public static async getCurrentUser(): Promise<{ sub: string; email: string; name: string; role: string; org: string; organization_name: string; two_factor_enabled: boolean; two_factor_verified: boolean } | null> {
    const response = await fetch('/api/me', { credentials: 'include' });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.user || null;
  }

  public static async verifyTOTPWithServer(inputCode: string): Promise<boolean> {
    const response = await fetch('/api/auth/2fa/verify', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totpCode: inputCode.trim() }),
    });
    return response.ok;
  }

  public static async setupTwoFactor(): Promise<string | null> {
    const response = await fetch('/api/auth/2fa/setup', { method: 'POST', credentials: 'include' });
    const payload = await response.json().catch(() => ({}));
    return response.ok && typeof payload.secret === 'string' ? payload.secret : null;
  }

  public static async enableTwoFactor(inputCode: string): Promise<boolean> {
    const response = await fetch('/api/auth/2fa/enable', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totpCode: inputCode.trim() }),
    });
    return response.ok;
  }

  public static async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  }

  public static async disableTwoFactor(): Promise<boolean> {
    const response = await fetch('/api/auth/2fa/disable', {
      method: 'POST',
      credentials: 'include',
    });
    return response.ok;
  }
}
