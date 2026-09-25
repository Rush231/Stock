import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { soundService } from './services/audioService';

import { Product, ProductLot, StockMovement, RestockAlert } from './types/inventory';
import { Branch, InterBranchTransfer } from './types/branches';
import { LocalSupplier, PurchaseOrder } from './types/suppliers';
import { EcommerceIntegration, EcommerceSyncEvent } from './types/ecommerce';
import { UserSession, SecurityAuditLog } from './types/auth';

import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { LotTrackingView } from './components/LotTrackingView';
import { EcommerceIntegrationsView } from './components/EcommerceIntegrationsView';
import { SuppliersView } from './components/SuppliersView';
import { BranchesView } from './components/BranchesView';
import { POSPerformanceView } from './components/POSPerformanceView';

import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { SecurityAnd2FAModal } from './components/SecurityAnd2FAModal';
import { PurchaseOrderModal } from './components/PurchaseOrderModal';
import { TransferStockModal } from './components/TransferStockModal';
import { ProductFormModal } from './components/ProductFormModal';
import { QuickAdjustModal } from './components/QuickAdjustModal';

export default function App() {
  // Domain State from StorageService
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [lots, setLots] = useState<ProductLot[]>(() => StorageService.getLots());
  const [branches, setBranches] = useState<Branch[]>(() => StorageService.getBranches());
  const [transfers, setTransfers] = useState<InterBranchTransfer[]>(() => StorageService.getTransfers());
  const [suppliers, setSuppliers] = useState<LocalSupplier[]>(() => StorageService.getSuppliers());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => StorageService.getPurchaseOrders());
  const [ecommerce, setEcommerce] = useState<EcommerceIntegration[]>(() => StorageService.getEcommerceIntegrations());
  const [syncEvents, setSyncEvents] = useState<EcommerceSyncEvent[]>(() => StorageService.getEcommerceSyncEvents());
  const [movements, setMovements] = useState<StockMovement[]>(() => StorageService.getMovements());
  const [user, setUser] = useState<UserSession>(() => StorageService.getUserSession());
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>(() => StorageService.getSecurityAuditLogs());

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');

  // Audio state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundService.isEnabled());

  // Modals Visibility
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isNewPOOpen, setIsNewPOOpen] = useState(false);
  const [preselectedPOProductId, setPreselectedPOProductId] = useState<string | undefined>(undefined);
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false);
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [quickAdjustProduct, setQuickAdjustProduct] = useState<Product | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto-calculated derived metrics
  const restockAlerts: RestockAlert[] = StorageService.getRestockAlerts(products);
  const valuation = StorageService.getInventoryValuation(products);
  const salesTrends = StorageService.getSalesTrends();
  const posMetrics = StorageService.getPOSMetrics();

  // Keep state synced with localStorage
  useEffect(() => {
    StorageService.saveProducts(products);
  }, [products]);

  useEffect(() => {
    StorageService.saveLots(lots);
  }, [lots]);

  useEffect(() => {
    StorageService.saveTransfers(transfers);
  }, [transfers]);

  useEffect(() => {
    StorageService.savePurchaseOrders(purchaseOrders);
  }, [purchaseOrders]);

  useEffect(() => {
    StorageService.saveEcommerceIntegrations(ecommerce);
  }, [ecommerce]);

  useEffect(() => {
    StorageService.saveEcommerceSyncEvents(syncEvents);
  }, [syncEvents]);

  useEffect(() => {
    StorageService.saveMovements(movements);
  }, [movements]);

  useEffect(() => {
    StorageService.saveUserSession(user);
  }, [user]);

  useEffect(() => {
    StorageService.saveSecurityAuditLogs(auditLogs);
  }, [auditLogs]);

  const handleToggleSound = () => {
    const newState = soundService.toggle();
    setSoundEnabled(newState);
  };

  // Log Security Action Helper
  const handleLogSecurityAction = (
    action: SecurityAuditLog['action'],
    details: string,
    status: 'SUCCESS' | 'WARNING' | 'CRITICAL' = 'SUCCESS'
  ) => {
    const newLog: SecurityAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      organizationId: user.organizationId,
      action,
      ipAddress: user.ipAddress,
      status,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Process Barcode Scan (Camera, Laser wedge or quick test)
  const handleProcessScan = (
    barcodeOrSku: string,
    action: 'LOOKUP' | 'STOCK_IN' | 'STOCK_OUT',
    targetBranchId: string,
    qty: number,
    lotNumber?: string
  ) => {
    const res = StorageService.processBarcodeScan(
      barcodeOrSku,
      action,
      targetBranchId,
      qty,
      lotNumber
    );

    if (res.success && res.product) {
      setProducts(StorageService.getProducts());
      setMovements(StorageService.getMovements());
    }

    return res;
  };

  // Trigger Omnichannel Sync
  const handleTriggerFullSync = () => {
    setIsSyncing(true);
    soundService.playBarcodeBeep();

    setTimeout(() => {
      setIsSyncing(false);
      soundService.playSuccessChime();

      const updatedEvents = StorageService.logEcommerceSyncEvent(
        'ALL',
        'Sincronización omnicanal completa forzada',
        '200 OK: 120 SKUs reconciliados en Mercado Libre, Shopify y Tiendanube'
      );
      setSyncEvents(updatedEvents);

      setEcommerce((prev) =>
        prev.map((e) => ({
          ...e,
          lastSyncTimestamp: new Date().toISOString(),
        }))
      );
    }, 1200);
  };

  // Simulate incoming sale from ecommerce platform
  const handleSimulateEcommerceSale = (
    platform: EcommerceIntegration['platform'],
    productId: string,
    quantity: number
  ) => {
    const res = StorageService.simulateEcommerceSale(platform, productId, quantity);
    if (res.success) {
      setProducts(StorageService.getProducts());
      setMovements(StorageService.getMovements());
      setSyncEvents(StorageService.getEcommerceSyncEvents());
    }
  };

  // Toggle Auto Deduct on ecommerce channel
  const handleToggleAutoDeduct = (integrationId: string) => {
    setEcommerce((prev) =>
      prev.map((item) =>
        item.id === integrationId
          ? { ...item, autoDeductStockOnSale: !item.autoDeductStockOnSale }
          : item
      )
    );
  };

  // Update buffer on ecommerce channel
  const handleUpdateBuffer = (integrationId: string, newBuffer: number) => {
    setEcommerce((prev) =>
      prev.map((item) =>
        item.id === integrationId
          ? { ...item, safetyStockBuffer: newBuffer }
          : item
      )
    );
  };

  // Create Purchase Order
  const handleCreatePO = (
    newPO: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt'>
  ) => {
    const poNumber = `OC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullPO: PurchaseOrder = {
      ...newPO,
      id: `po-${Date.now()}`,
      orderNumber: poNumber,
      createdAt: new Date().toISOString(),
    };

    setPurchaseOrders((prev) => [fullPO, ...prev]);

    handleLogSecurityAction(
      'SETTINGS_CHANGED',
      `Nueva Orden de Compra ${poNumber} emitida al proveedor ${fullPO.supplierName} por valor de $${fullPO.totalAmount.toLocaleString('es-AR')}.`,
      'SUCCESS'
    );
  };

  // Receive Purchase Order (Stocks In + Lots Created)
  const handleReceivePO = (po: PurchaseOrder) => {
    const updated = StorageService.receivePurchaseOrder(po.id, user.name);
    setPurchaseOrders(updated);
    setProducts(StorageService.getProducts());
    setMovements(StorageService.getMovements());
    setLots(StorageService.getLots());
  };

  // Update PO Status
  const handleUpdatePOStatus = (poId: string, newStatus: PurchaseOrder['status']) => {
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, status: newStatus } : p))
    );
  };

  // Create Transfer
  const handleCreateTransfer = (
    newTransfer: Omit<InterBranchTransfer, 'id' | 'remitoNumber' | 'createdDate'>
  ) => {
    const remitoNumber = `RTO-0001-${Math.floor(10000 + Math.random() * 90000)}`;
    const fullTransfer: InterBranchTransfer = {
      ...newTransfer,
      id: `tr-${Date.now()}`,
      remitoNumber,
      createdDate: new Date().toISOString(),
    };

    const currentProducts = StorageService.getProducts();
    const updatedProducts = currentProducts.map((p) => {
      const transferItem = fullTransfer.items.find((it) => it.productId === p.id);
      if (!transferItem) return p;

      const stocks = p.stocks.map((s) => {
        if (s.branchId === fullTransfer.fromBranchId) {
          const newQty = Math.max(0, s.quantity - transferItem.quantity);
          const newAvail = Math.max(0, s.available - transferItem.quantity);
          return { ...s, quantity: newQty, available: newAvail };
        }
        return s;
      });

      return { ...p, stocks };
    });

    setProducts(updatedProducts);
    setTransfers((prev) => [fullTransfer, ...prev]);

    for (const item of fullTransfer.items) {
      StorageService.addMovement({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        barcode: '',
        branchName: fullTransfer.fromBranchName,
        type: 'TRANSFER_OUT',
        quantity: -item.quantity,
        referenceId: remitoNumber,
        performedBy: user.name,
      });
    }

    setMovements(StorageService.getMovements());
  };

  // Receive Transfer at Destination
  const handleReceiveTransfer = (transferId: string) => {
    const target = transfers.find((t) => t.id === transferId);
    if (!target) return;

    const currentProducts = StorageService.getProducts();
    const updatedProducts = currentProducts.map((p) => {
      const transferItem = target.items.find((it) => it.productId === p.id);
      if (!transferItem) return p;

      const stocks = p.stocks.map((s) => {
        if (s.branchId === target.toBranchId) {
          return {
            ...s,
            quantity: s.quantity + transferItem.quantity,
            available: s.available + transferItem.quantity,
          };
        }
        return s;
      });

      return { ...p, stocks };
    });

    setProducts(updatedProducts);

    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? {
              ...t,
              status: 'COMPLETED',
              receivedDate: new Date().toISOString(),
              receivedBy: user.name,
            }
          : t
      )
    );

    for (const item of target.items) {
      StorageService.addMovement({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        barcode: '',
        branchName: target.toBranchName,
        type: 'TRANSFER_IN',
        quantity: item.quantity,
        referenceId: target.remitoNumber,
        performedBy: user.name,
      });
    }

    setMovements(StorageService.getMovements());
  };

  // Lot Management
  const handleUpdateLotStatus = (lotId: string, newStatus: ProductLot['status']) => {
    setLots((prev) =>
      prev.map((l) => (l.id === lotId ? { ...l, status: newStatus } : l))
    );
    handleLogSecurityAction(
      'SETTINGS_CHANGED',
      `Estado del lote ${lotId} actualizado a ${newStatus}.`,
      'SUCCESS'
    );
  };

  const handleCreateLot = (newLot: Omit<ProductLot, 'id' | 'createdAt'>) => {
    const fullLot: ProductLot = {
      ...newLot,
      id: `lot-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setLots((prev) => [fullLot, ...prev]);
    soundService.playSuccessChime();
  };

  // Save new Product
  const handleSaveProduct = (
    newProductData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newProduct: Product = {
      ...newProductData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    soundService.playSuccessChime();
  };

  // Quick Adjust
  const handleConfirmAdjust = (
    productId: string,
    branchId: string,
    newQuantity: number,
    reason: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    const branch = branches.find((b) => b.id === branchId);
    if (!prod || !branch) return;

    const currentBranchStock = prod.stocks.find((s) => s.branchId === branchId);
    const oldQty = currentBranchStock?.available || 0;
    const diff = newQuantity - oldQty;

    const updatedProducts = products.map((p) => {
      if (p.id !== productId) return p;
      return {
        ...p,
        stocks: p.stocks.map((s) =>
          s.branchId === branchId
            ? { ...s, quantity: newQuantity, available: newQuantity }
            : s
        ),
      };
    });

    setProducts(updatedProducts);

    StorageService.addMovement({
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      barcode: prod.barcode,
      branchName: branch.name,
      type: 'ADJUSTMENT',
      quantity: diff,
      referenceId: reason,
      performedBy: user.name,
    });

    setMovements(StorageService.getMovements());
    soundService.playSuccessChime();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Fixed Top Bar Navigation */}
      <Header
        currentTab={activeTab}
        onTabChange={setActiveTab}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={setSelectedBranchId}
        user={user}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenScannerModal={() => setIsScannerOpen(true)}
        lowStockCount={restockAlerts.length}
        isSyncing={isSyncing}
        onQuickSync={handleTriggerFullSync}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-6">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            products={products}
            valuation={valuation}
            restockAlerts={restockAlerts}
            movements={movements}
            transfers={transfers}
            ecommerce={ecommerce}
            branches={branches}
            salesTrends={salesTrends}
            selectedBranchId={selectedBranchId}
            onOpenNewPO={(preselected) => {
              setPreselectedPOProductId(preselected);
              setIsNewPOOpen(true);
            }}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            branches={branches}
            selectedBranchId={selectedBranchId}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenNewProduct={() => setIsNewProductOpen(true)}
            onQuickAdjust={(p) => setQuickAdjustProduct(p)}
            onNavigateLots={() => setActiveTab('lots')}
          />
        )}

        {activeTab === 'lots' && (
          <LotTrackingView
            lots={lots}
            products={products}
            branches={branches}
            onUpdateLotStatus={handleUpdateLotStatus}
            onCreateLot={handleCreateLot}
          />
        )}

        {activeTab === 'ecommerce' && (
          <EcommerceIntegrationsView
            integrations={ecommerce}
            syncEvents={syncEvents}
            products={products}
            branches={branches}
            onTriggerFullSync={handleTriggerFullSync}
            isSyncing={isSyncing}
            onSimulateEcommerceSale={handleSimulateEcommerceSale}
            onToggleAutoDeduct={handleToggleAutoDeduct}
            onUpdateBuffer={handleUpdateBuffer}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersView
            suppliers={suppliers}
            purchaseOrders={purchaseOrders}
            products={products}
            branches={branches}
            restockAlerts={restockAlerts}
            onOpenCreatePO={(preselected) => {
              setPreselectedPOProductId(preselected);
              setIsNewPOOpen(true);
            }}
            onUpdatePOStatus={handleUpdatePOStatus}
            onReceivePO={handleReceivePO}
          />
        )}

        {activeTab === 'branches' && (
          <BranchesView
            branches={branches}
            transfers={transfers}
            products={products}
            onOpenNewTransfer={() => setIsNewTransferOpen(true)}
            onReceiveTransfer={handleReceiveTransfer}
          />
        )}

        {activeTab === 'pos_reports' && (
          <POSPerformanceView
            metrics={posMetrics}
            branches={branches}
          />
        )}

      </main>

      {/* Global Modals */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        lots={lots}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onProcessScan={handleProcessScan}
      />

      <SecurityAnd2FAModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        user={user}
        auditLogs={auditLogs}
        onUpdateUser={setUser}
        onLogSecurityAction={handleLogSecurityAction}
      />

      <PurchaseOrderModal
        isOpen={isNewPOOpen}
        onClose={() => {
          setIsNewPOOpen(false);
          setPreselectedPOProductId(undefined);
        }}
        suppliers={suppliers}
        products={products}
        branches={branches}
        preselectedProductId={preselectedPOProductId}
        onCreatePO={handleCreatePO}
      />

      <TransferStockModal
        isOpen={isNewTransferOpen}
        onClose={() => setIsNewTransferOpen(false)}
        branches={branches}
        products={products}
        lots={lots}
        onCreateTransfer={handleCreateTransfer}
      />

      <ProductFormModal
        isOpen={isNewProductOpen}
        onClose={() => setIsNewProductOpen(false)}
        branches={branches}
        suppliers={suppliers}
        onSaveProduct={handleSaveProduct}
      />

      <QuickAdjustModal
        isOpen={!!quickAdjustProduct}
        onClose={() => setQuickAdjustProduct(null)}
        product={quickAdjustProduct}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onConfirmAdjust={handleConfirmAdjust}
      />

    </div>
  );
}
