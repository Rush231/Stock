export interface LocalSupplier {
  id: string;
  name: string;
  cuit: string; // Tax ID
  category: string;
  city: string;
  address: string;
  contactName: string;
  phone: string; // WhatsApp enabled
  email: string;
  leadTimeDays: number; // e.g., 2 days, 1 day, 5 days
  minimumOrderAmount: number; // in currency
  paymentTerms: 'CONTADO' | '15_DIAS' | '30_DIAS' | '60_DIAS';
  deliveryReliabilityScore: number; // 0-100%
  suppliedProductIds: string[];
  notes?: string;
}

export type PurchaseOrderStatus = 
  | 'DRAFT'
  | 'SENT'
  | 'CONFIRMED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'CANCELLED';

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string; // e.g. "OC-2026-0891"
  supplierId: string;
  supplierName: string;
  destinationBranchId: string;
  destinationBranchName: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  totalAmount: number;
  expectedDeliveryDate: string;
  createdAt: string;
  sentDate?: string;
  receivedDate?: string;
  dispatchMethod: 'WHATSAPP' | 'EMAIL' | 'DIRECT_EDI';
  notes?: string;
  assignedLotNumber?: string;
}
