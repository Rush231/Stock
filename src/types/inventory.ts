export interface ProductLot {
  id: string;
  productId: string;
  lotNumber: string; // e.g., 'LOT-2026-X89'
  manufacturingDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  initialQuantity: number;
  currentQuantity: number;
  status: 'ACTIVE' | 'QUARANTINE' | 'EXPIRED' | 'DEPLETED';
  branchId: string; // which branch holds this lot
  supplierId: string;
  notes?: string;
  createdAt: string;
}

export interface BranchStock {
  branchId: string;
  branchName: string;
  quantity: number;
  reserved: number; // for pending ecommerce orders
  available: number; // quantity - reserved
  aisleLocation?: string; // e.g. "Pasillo B - Estante 4"
}

export interface Product {
  id: string;
  sku: string;
  barcode: string; // EAN-13, Code 128
  name: string;
  description?: string;
  category: string;
  unit: string; // 'unidades', 'cajas', 'kg', 'litros'
  costPrice: number; // in USD or ARS (e.g. $12.50)
  salePrice: number; // in USD or ARS (e.g. $24.99)
  minStock: number; // Minimum threshold before alert
  targetStock: number; // Desired level
  supplierId: string;
  supplierName: string;
  ecommerceSync: boolean;
  ecommerceMappings: {
    shopifyId?: string;
    mercadolibreId?: string;
    tiendanubeId?: string;
    woocommerceId?: string;
  };
  stocks: BranchStock[]; // Stock per branch
  hasLotTracking: boolean;
  createdAt?: string;
  updatedAt: string;
}

export type MovementType = 
  | 'RECEPTION' // Incoming from supplier
  | 'POS_SALE' // Sold at physical checkout
  | 'ECOMMERCE_SALE' // Sold via Shopify / Mercado Libre / etc.
  | 'TRANSFER_OUT' // Dispatched to another branch
  | 'TRANSFER_IN' // Received from another branch
  | 'ADJUSTMENT' // Manual inventory adjustment
  | 'RETURN' // Customer return
  | 'DISCARD'; // Expired or damaged

export interface StockMovement {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  type: MovementType;
  quantity: number; // positive or negative
  lotNumber?: string;
  fromBranchId?: string;
  toBranchId?: string;
  branchName: string;
  channel?: 'POS' | 'SHOPIFY' | 'MERCADOLIBRE' | 'TIENDANUBE' | 'WOOCOMMERCE' | 'MANUAL';
  referenceId?: string; // Ticket number, PO number, Order #
  performedBy: string; // User name
  notes?: string;
}

export interface RestockAlert {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentTotalStock: number;
  minStock: number;
  targetStock: number;
  deficit: number;
  suggestedReorder: number;
  supplierId: string;
  supplierName: string;
  estimatedLeadDays: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
}
