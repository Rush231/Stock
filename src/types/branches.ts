export interface Branch {
  id: string;
  code: string; // e.g. "B01"
  name: string;
  type: 'PHYSICAL_STORE' | 'CENTRAL_WAREHOUSE' | 'EXPRESS_POINT' | 'DISTRIBUTION_HUB';
  address: string;
  city: string;
  phone: string;
  manager: string;
  activePosCount: number;
  isMainHub: boolean;
  totalSkus: number;
  totalStockUnits: number;
}

export type TransferStatus = 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface InterBranchTransferItem {
  productId: string;
  productName: string;
  sku: string;
  lotNumber?: string;
  quantity: number;
  receivedQuantity?: number;
}

export interface InterBranchTransfer {
  id: string;
  remitoNumber: string; // e.g. "RTO-0001-00049218"
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  status: TransferStatus;
  items: InterBranchTransferItem[];
  transportCompany?: string;
  driverName?: string;
  trackingCode?: string;
  createdDate: string;
  dispatchedDate?: string;
  receivedDate?: string;
  createdBy: string;
  receivedBy?: string;
  notes?: string;
}
