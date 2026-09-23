export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'POS_CASHIER' | 'AUDITOR';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  organizationId: string;
  organizationName: string;
  branchId: string; // Current assigned branch
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  token: string;
  tokenExpiresAt: number; // timestamp
  lastLogin: string;
  ipAddress: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  organizationId: string;
  action: 'LOGIN' | 'LOGOUT' | '2FA_VERIFIED' | '2FA_ENABLED' | 'TOKEN_REFRESH' | 'UNAUTHORIZED_CROSS_TENANT_BLOCKED' | 'STOCK_OVERRIDE' | 'SETTINGS_CHANGED';
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'CRITICAL';
}

export interface TwoFactorState {
  isConfigured: boolean;
  secret: string;
  qrUri: string;
  backupCodes: string[];
}
