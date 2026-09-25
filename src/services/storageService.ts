import { Product, ProductLot, StockMovement, RestockAlert, BranchStock } from '../types/inventory';
import { Branch, InterBranchTransfer } from '../types/branches';
import { EcommerceIntegration, EcommerceSyncEvent } from '../types/ecommerce';
import { LocalSupplier, PurchaseOrder } from '../types/suppliers';
import { POSMetric, SalesTrendDataPoint, InventoryValuationMetric } from '../types/analytics';
import { UserSession, SecurityAuditLog } from '../types/auth';
import {
  INITIAL_BRANCHES,
  INITIAL_PRODUCTS,
  INITIAL_LOTS,
  INITIAL_SUPPLIERS,
  INITIAL_TRANSFERS,
  INITIAL_ECOMMERCE,
  INITIAL_SYNC_EVENTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_POS_METRICS,
  SALES_TRENDS,
  INITIAL_USER,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'omnistock_products_v1',
  LOTS: 'omnistock_lots_v1',
  BRANCHES: 'omnistock_branches_v1',
  SUPPLIERS: 'omnistock_suppliers_v1',
  TRANSFERS: 'omnistock_transfers_v1',
  ECOMMERCE: 'omnistock_ecommerce_v1',
  SYNC_EVENTS: 'omnistock_sync_events_v1',
  PURCHASE_ORDERS: 'omnistock_po_v1',
  POS_METRICS: 'omnistock_pos_metrics_v1',
  MOVEMENTS: 'omnistock_movements_v1',
  USER: 'omnistock_user_v1',
  AUDIT_LOGS: 'omnistock_audit_logs_v1',
  CURRENT_BRANCH: 'omnistock_selected_branch_v1',
};

export class StorageServiceClass {
  public getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  }

  public saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  public getLots(): ProductLot[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOTS);
      return data ? JSON.parse(data) : INITIAL_LOTS;
    } catch {
      return INITIAL_LOTS;
    }
  }

  public saveLots(lots: ProductLot[]): void {
    localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(lots));
  }

  public getBranches(): Branch[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BRANCHES);
      return data ? JSON.parse(data) : INITIAL_BRANCHES;
    } catch {
      return INITIAL_BRANCHES;
    }
  }

  public saveBranches(branches: Branch[]): void {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
  }

  public getSuppliers(): LocalSupplier[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      return data ? JSON.parse(data) : INITIAL_SUPPLIERS;
    } catch {
      return INITIAL_SUPPLIERS;
    }
  }

  public saveSuppliers(suppliers: LocalSupplier[]): void {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }

  public getTransfers(): InterBranchTransfer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
      return data ? JSON.parse(data) : INITIAL_TRANSFERS;
    } catch {
      return INITIAL_TRANSFERS;
    }
  }

  public saveTransfers(transfers: InterBranchTransfer[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  }

  public getEcommerce(): EcommerceIntegration[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ECOMMERCE);
      return data ? JSON.parse(data) : INITIAL_ECOMMERCE;
    } catch {
      return INITIAL_ECOMMERCE;
    }
  }

  public saveEcommerce(ecom: EcommerceIntegration[]): void {
    localStorage.setItem(STORAGE_KEYS.ECOMMERCE, JSON.stringify(ecom));
  }

  public getSyncEvents(): EcommerceSyncEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_EVENTS);
      return data ? JSON.parse(data) : INITIAL_SYNC_EVENTS;
    } catch {
      return INITIAL_SYNC_EVENTS;
    }
  }

  public saveSyncEvents(events: EcommerceSyncEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.SYNC_EVENTS, JSON.stringify(events));
  }

  public getPurchaseOrders(): PurchaseOrder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS);
      return data ? JSON.parse(data) : INITIAL_PURCHASE_ORDERS;
    } catch {
      return INITIAL_PURCHASE_ORDERS;
    }
  }

  public savePurchaseOrders(pos: PurchaseOrder[]): void {
    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(pos));
  }

  public getPOSMetrics(): POSMetric[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POS_METRICS);
      return data ? JSON.parse(data) : INITIAL_POS_METRICS;
    } catch {
      return INITIAL_POS_METRICS;
    }
  }

  public savePOSMetrics(metrics: POSMetric[]): void {
    localStorage.setItem(STORAGE_KEYS.POS_METRICS, JSON.stringify(metrics));
  }

  public getUser(): UserSession {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  }

  public saveUser(user: UserSession): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  public getAuditLogs(): SecurityAuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }

  public logSecurityAction(
    action: SecurityAuditLog['action'],
    details: string,
    status: 'SUCCESS' | 'WARNING' | 'CRITICAL' = 'SUCCESS'
  ): void {
    const user = this.getUser();
    const logs = this.getAuditLogs();
    const newLog: SecurityAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      organizationId: user.organizationId,
      action,
      details,
      ipAddress: user.ipAddress,
      status,
    };
    this.saveAuditLogs([newLog, ...logs.slice(0, 49)]);
  }

  public saveAuditLogs(logs: SecurityAuditLog[]): void {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  public getSelectedBranchId(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_BRANCH) || 'ALL';
  }

  public setSelectedBranchId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_BRANCH, id);
  }

  public getMovements(): StockMovement[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    // Default initial movements
    return [
      {
        id: 'mov-01',
        timestamp: '2026-09-23T08:31:00Z',
        productId: 'prod-01',
        productName: 'Auriculares Inalámbricos Pro ANC',
        sku: 'AUR-BT-ANC-01',
        barcode: '7798123450012',
        type: 'ECOMMERCE_SALE',
        quantity: -2,
        branchName: 'Sucursal 03 - Depósito Logístico Norte',
        channel: 'MERCADOLIBRE',
        referenceId: 'MLA-2000008912918',
        performedBy: 'Sync Bot Mercado Libre',
        notes: 'Venta online automática despachada desde depósito central.',
      },
      {
        id: 'mov-02',
        timestamp: '2026-09-23T07:15:00Z',
        productId: 'prod-01',
        productName: 'Auriculares Inalámbricos Pro ANC',
        sku: 'AUR-BT-ANC-01',
        barcode: '7798123450012',
        type: 'TRANSFER_OUT',
        quantity: -10,
        lotNumber: 'LOT-2026-A12',
        fromBranchId: 'branch-03',
        toBranchId: 'branch-02',
        branchName: 'Sucursal 03 - Depósito Logístico Norte',
        referenceId: 'RTO-0001-00049218',
        performedBy: 'Roberto Gómez',
        notes: 'Despacho hacia Sucursal Palermo Flagship.',
      },
      {
        id: 'mov-03',
        timestamp: '2026-09-23T06:50:00Z',
        productId: 'prod-02',
        productName: 'Mouse Óptico Ergonómico Recargable',
        sku: 'MOU-WL-ERG-02',
        barcode: '7798123450029',
        type: 'POS_SALE',
        quantity: -1,
        branchName: 'Sucursal 01 - Casa Central',
        channel: 'POS',
        referenceId: 'TK-0001-94812',
        performedBy: 'Martín Soria (Cajero)',
        notes: 'Venta física mostrador Caja 1.',
      },
      {
        id: 'mov-04',
        timestamp: '2026-09-22T14:10:00Z',
        productId: 'prod-02',
        productName: 'Mouse Óptico Ergonómico Recargable',
        sku: 'MOU-WL-ERG-02',
        barcode: '7798123450029',
        type: 'RECEPTION',
        quantity: 50,
        lotNumber: 'LOT-2026-B05',
        branchName: 'Sucursal 01 - Casa Central',
        referenceId: 'OC-2026-0890',
        performedBy: 'Mariano Benítez',
        notes: 'Recepción de mercadería de ElectroTech Mayorista BA.',
      },
    ];
  }

  public saveMovements(movements: StockMovement[]): void {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  }

  public addStockMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>): void {
    const movements = this.getMovements();
    const newMovement: StockMovement = {
      ...movement,
      id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    this.saveMovements([newMovement, ...movements.slice(0, 99)]);
  }

  /**
   * Calculate automatic restock alerts across all products
   */
  public getRestockAlerts(products?: Product[]): RestockAlert[] {
    const list = products || this.getProducts();
    const suppliers = this.getSuppliers();
    const alerts: RestockAlert[] = [];

    list.forEach((p) => {
      const totalStock = p.stocks.reduce((acc, s) => acc + s.available, 0);
      if (totalStock <= p.minStock) {
        const supp = suppliers.find((s) => s.id === p.supplierId);
        const deficit = p.targetStock - totalStock;
        const urgency: 'HIGH' | 'MEDIUM' | 'LOW' =
          totalStock <= Math.floor(p.minStock * 0.4)
            ? 'HIGH'
            : totalStock <= Math.floor(p.minStock * 0.75)
            ? 'MEDIUM'
            : 'LOW';

        alerts.push({
          id: `alert-${p.id}`,
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          currentTotalStock: totalStock,
          minStock: p.minStock,
          targetStock: p.targetStock,
          deficit,
          suggestedReorder: Math.max(deficit, 10),
          supplierId: p.supplierId,
          supplierName: p.supplierName,
          estimatedLeadDays: supp?.leadTimeDays || 2,
          urgency,
          createdAt: new Date().toISOString(),
        });
      }
    });

    return alerts.sort((a, b) => {
      const weight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return weight[b.urgency] - weight[a.urgency];
    });
  }

  /**
   * Calculate valuation and turnover metrics
   */
  public getValuationMetrics(products?: Product[]): InventoryValuationMetric {
    const list = products || this.getProducts();
    let totalCost = 0;
    let totalRetail = 0;
    let totalUnits = 0;

    list.forEach((p) => {
      const units = p.stocks.reduce((acc, s) => acc + s.quantity, 0);
      totalUnits += units;
      totalCost += units * p.costPrice;
      totalRetail += units * p.salePrice;
    });

    return {
      totalInventoryCost: totalCost,
      totalInventoryRetailValue: totalRetail,
      potentialProfit: totalRetail - totalCost,
      totalSkus: list.length,
      totalPhysicalUnits: totalUnits,
      turnoverRatio: 4.8,
      daysOfInventoryRemaining: 24,
    };
  }

  /**
   * Quick scan action: adjust stock for a product barcode
   */
  public processBarcodeScan(
    barcodeOrSku: string,
    action: 'LOOKUP' | 'STOCK_IN' | 'STOCK_OUT',
    branchId: string,
    qty: number = 1,
    lotNumber?: string
  ): { success: boolean; product?: Product; message: string } {
    const products = this.getProducts();
    const cleanQuery = barcodeOrSku.trim().toLowerCase();
    const product = products.find(
      (p) =>
        p.barcode.toLowerCase() === cleanQuery ||
        p.sku.toLowerCase() === cleanQuery
    );

    if (!product) {
      return { success: false, message: `Código no encontrado: ${barcodeOrSku}` };
    }

    if (action === 'LOOKUP') {
      return { success: true, product, message: `Producto localizado: ${product.name}` };
    }

    const branches = this.getBranches();
    const targetBranch = branches.find((b) => b.id === branchId) || branches[0];
    const user = this.getUser();

    // Find branch stock or initialize it
    let branchStock = product.stocks.find((s) => s.branchId === targetBranch.id);
    if (!branchStock) {
      branchStock = {
        branchId: targetBranch.id,
        branchName: targetBranch.name,
        quantity: 0,
        reserved: 0,
        available: 0,
      };
      product.stocks.push(branchStock);
    }

    if (action === 'STOCK_OUT') {
      if (branchStock.available < qty) {
        return {
          success: false,
          product,
          message: `Stock insuficiente en ${targetBranch.name}. Disponible: ${branchStock.available}, Solicitado: ${qty}`,
        };
      }
      branchStock.quantity -= qty;
      branchStock.available -= qty;

      this.addStockMovement({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        type: 'POS_SALE',
        quantity: -qty,
        branchName: targetBranch.name,
        performedBy: user.name,
        notes: `Despacho rápido por lector de código de barras (${qty} u.)`,
        channel: 'POS',
      });
    } else if (action === 'STOCK_IN') {
      branchStock.quantity += qty;
      branchStock.available += qty;

      // Also update lot if specified
      if (lotNumber) {
        const lots = this.getLots();
        const lot = lots.find((l) => l.lotNumber === lotNumber && l.productId === product.id);
        if (lot) {
          lot.currentQuantity += qty;
          this.saveLots(lots);
        }
      }

      this.addStockMovement({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        type: 'RECEPTION',
        quantity: qty,
        branchName: targetBranch.name,
        lotNumber,
        performedBy: user.name,
        notes: `Ingreso rápido por lector de código de barras (${qty} u.)`,
      });
    }

    product.updatedAt = new Date().toISOString();
    this.saveProducts(products);

    return {
      success: true,
      product,
      message: `${action === 'STOCK_IN' ? 'Ingresadas' : 'Despachadas'} ${qty} unidad(es) de "${product.name}" en ${targetBranch.name}.`,
    };
  }

  public getEcommerceIntegrations(): EcommerceIntegration[] {
    return this.getEcommerce();
  }

  public saveEcommerceIntegrations(ecom: EcommerceIntegration[]): void {
    this.saveEcommerce(ecom);
  }

  public getEcommerceSyncEvents(): EcommerceSyncEvent[] {
    return this.getSyncEvents();
  }

  public saveEcommerceSyncEvents(events: EcommerceSyncEvent[]): void {
    this.saveSyncEvents(events);
  }

  public getUserSession(): UserSession {
    return { ...this.getUser(), token: '' };
  }

  public saveUserSession(user: UserSession): void {
    this.saveUser({ ...user, token: '' });
  }

  public getSecurityAuditLogs(): SecurityAuditLog[] {
    return this.getAuditLogs();
  }

  public saveSecurityAuditLogs(logs: SecurityAuditLog[]): void {
    this.saveAuditLogs(logs);
  }

  public getInventoryValuation(products?: Product[]): InventoryValuationMetric {
    return this.getValuationMetrics(products);
  }

  public getSalesTrends(): SalesTrendDataPoint[] {
    return SALES_TRENDS;
  }

  public addMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>): void {
    this.addStockMovement(movement);
  }

  public logEcommerceSyncEvent(
    platform: EcommerceIntegration['platform'] | 'ALL',
    message: string,
    payloadSummary?: string,
    quantityDelta?: number
  ): EcommerceSyncEvent[] {
    const events = this.getSyncEvents();
    const newEvent: EcommerceSyncEvent = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      platform,
      eventType: quantityDelta ? 'STOCK_UPDATE' : 'NEW_ORDER',
      status: 'SUCCESS',
      message,
      payloadSummary,
      quantityDelta,
    };
    const updated = [newEvent, ...events.slice(0, 49)];
    this.saveSyncEvents(updated);
    return updated;
  }

  public simulateEcommerceSale(
    platform: EcommerceIntegration['platform'],
    productId: string,
    quantity: number = 1
  ): { success: boolean; product?: Product; message: string } {
    const products = this.getProducts();
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return { success: false, message: 'Producto no encontrado' };
    }

    const integrations = this.getEcommerce();
    const currentIntegration = integrations.find((i) => i.platform === platform) || integrations[0];
    const targetBranchId = currentIntegration?.assignedWarehouseBranchId || 'branch-03';
    const branches = this.getBranches();
    const branch = branches.find((b) => b.id === targetBranchId) || branches[0];

    const branchStock = product.stocks.find((s) => s.branchId === branch.id);
    if (!branchStock || branchStock.available < quantity) {
      return {
        success: false,
        product,
        message: `Stock insuficiente en depósito ${branch.name} para la venta online.`,
      };
    }

    branchStock.quantity -= quantity;
    branchStock.available -= quantity;
    product.updatedAt = new Date().toISOString();
    this.saveProducts(products);

    this.addStockMovement({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      barcode: product.barcode,
      type: 'ECOMMERCE_SALE',
      quantity: -quantity,
      branchName: branch.name,
      channel: platform,
      referenceId: `${platform.substring(0, 3)}-${Math.floor(10000000 + Math.random() * 90000000)}`,
      performedBy: `Webhook Bot (${platform})`,
      notes: `Venta online aprobada. Descuento automático en ${branch.name}.`,
    });

    this.logEcommerceSyncEvent(
      platform,
      `Venta confirmada: ${quantity}x ${product.name}`,
      `Webhook recibido. Stock remanente en red: ${product.stocks.reduce((acc, s) => acc + s.available, 0)} u.`,
      -quantity
    );

    return {
      success: true,
      product,
      message: `Venta de ${quantity} u. procesada con éxito desde ${platform}.`,
    };
  }

  public receivePurchaseOrder(poId: string, userName: string = 'Supervisor'): PurchaseOrder[] {
    const purchaseOrders = this.getPurchaseOrders();
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return purchaseOrders;

    po.status = 'RECEIVED';
    po.receivedDate = new Date().toISOString();
    this.savePurchaseOrders(purchaseOrders);

    const products = this.getProducts();
    const lots = this.getLots();

    for (const item of po.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        let bStock = prod.stocks.find((s) => s.branchId === po.destinationBranchId);
        if (!bStock) {
          bStock = {
            branchId: po.destinationBranchId,
            branchName: po.destinationBranchName,
            quantity: 0,
            reserved: 0,
            available: 0,
          };
          prod.stocks.push(bStock);
        }
        bStock.quantity += item.quantity;
        bStock.available += item.quantity;
        prod.updatedAt = new Date().toISOString();

        if (po.assignedLotNumber) {
          lots.push({
            id: `lot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: prod.id,
            lotNumber: po.assignedLotNumber,
            manufacturingDate: new Date().toISOString().split('T')[0],
            expirationDate: new Date(Date.now() + 86400000 * 365 * 2).toISOString().split('T')[0],
            initialQuantity: item.quantity,
            currentQuantity: item.quantity,
            status: 'ACTIVE',
            branchId: po.destinationBranchId,
            supplierId: po.supplierId,
            createdAt: new Date().toISOString(),
            notes: `Ingreso por Orden de Compra ${po.orderNumber} de ${po.supplierName}`,
          });
        }

        this.addStockMovement({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          type: 'RECEPTION',
          quantity: item.quantity,
          branchName: po.destinationBranchName,
          lotNumber: po.assignedLotNumber,
          referenceId: po.orderNumber,
          performedBy: userName,
          notes: `Recepción de mercadería de ${po.supplierName}`,
        });
      }
    }

    this.saveProducts(products);
    this.saveLots(lots);
    return purchaseOrders;
  }

  /**
   * Reset to initial defaults if requested
   */
  public resetToDefaults(): void {
    localStorage.clear();
  }
}

export const StorageService = new StorageServiceClass();
export const storageService = StorageService;
