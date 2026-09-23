export type EcommercePlatform = 'SHOPIFY' | 'MERCADOLIBRE' | 'TIENDANUBE' | 'WOOCOMMERCE';

export interface EcommerceIntegration {
  id: string;
  platform: EcommercePlatform;
  storeName: string;
  storeUrl: string;
  status: 'CONNECTED' | 'SYNCING' | 'ERROR' | 'PAUSED';
  syncIntervalMinutes: number; // e.g., 5 min
  lastSyncTimestamp: string;
  totalSyncedProducts: number;
  assignedWarehouseBranchId: string;
  apiKeyMasked: string;
  webhookSecretMasked: string;
  autoDeductStockOnSale: boolean;
  twoWayPriceSync: boolean;
  safetyStockBuffer: number; // e.g. 2 units reserved from showing online
}

export interface EcommerceSyncEvent {
  id: string;
  timestamp: string;
  platform: EcommercePlatform | 'ALL';
  eventType: 'STOCK_UPDATE' | 'NEW_ORDER' | 'CATALOG_SYNC' | 'WEBHOOK_RECEIVED' | 'RATE_LIMIT';
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  productSku?: string;
  productName?: string;
  orderNumber?: string;
  quantityDelta?: number;
  message: string;
  payloadSummary?: string;
}
