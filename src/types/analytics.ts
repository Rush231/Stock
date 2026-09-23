export interface POSMetric {
  branchId: string;
  branchName: string;
  todayRevenue: number;
  todayTransactions: number;
  averageTicket: number;
  stockoutIncidents: number; // quiebres de stock detectados
  cashierName: string;
  cashierStatus: 'ACTIVE' | 'BREAK' | 'CLOSED';
  paymentBreakdown: {
    cashPercentage: number;
    cardPercentage: number;
    qrTransferPercentage: number;
  };
  topSellingProducts: {
    sku: string;
    name: string;
    unitsSold: number;
    revenue: number;
  }[];
  hourlySales: { hour: string; sales: number; transactions: number }[];
}

export interface SalesTrendDataPoint {
  date: string; // "Lun 16", "Mar 17", etc.
  physicalSales: number;
  ecommerceSales: number;
  totalRevenue: number;
  unitsSold: number;
  margin: number;
}

export interface InventoryValuationMetric {
  totalInventoryCost: number;
  totalInventoryRetailValue: number;
  potentialProfit: number;
  totalSkus: number;
  totalPhysicalUnits: number;
  turnoverRatio: number; // e.g., 4.2x
  daysOfInventoryRemaining: number; // e.g. 26 days
}
