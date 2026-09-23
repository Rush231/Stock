import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Scan, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Search,
  Sparkles,
  RefreshCw,
  Layers,
  Keyboard
} from 'lucide-react';
import { Product, ProductLot } from '../types/inventory';
import { Branch } from '../types/branches';
import { soundService } from '../services/audioService';
import confetti from 'canvas-confetti';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  lots: ProductLot[];
  branches: Branch[];
  selectedBranchId: string;
  onProcessScan: (
    barcodeOrSku: string, 
    action: 'LOOKUP' | 'STOCK_IN' | 'STOCK_OUT', 
    branchId: string, 
    qty: number,
    lotNumber?: string
  ) => { success: boolean; product?: Product; message: string };
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  lots,
  branches,
  selectedBranchId,
  onProcessScan,
}) => {
  const [actionType, setActionType] = useState<'LOOKUP' | 'STOCK_IN' | 'STOCK_OUT'>('LOOKUP');
  const [targetBranchId, setTargetBranchId] = useState<string>(
    selectedBranchId === 'ALL' ? branches[0]?.id || 'branch-01' : selectedBranchId
  );
  const [manualCode, setManualCode] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedLotNumber, setSelectedLotNumber] = useState<string>('');
  const [lastScannedResult, setLastScannedResult] = useState<{
    product?: Product;
    success: boolean;
    message: string;
    timestamp: string;
  } | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Sync selected branch if prop changes
  useEffect(() => {
    if (selectedBranchId !== 'ALL') {
      setTargetBranchId(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Clean up camera on close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setLastScannedResult(null);
      setManualCode('');
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La API de cámara no es compatible con este navegador.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      startBarcodeDetection();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo acceder a la cámara. Verifique los permisos.';
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Automated Barcode Detection from Camera Stream
  const startBarcodeDetection = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    // Check if browser has native BarcodeDetector
    const hasBarcodeDetector = 'BarcodeDetector' in window;

    scanIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      if (hasBarcodeDetector) {
        try {
          // @ts-expect-error Native BarcodeDetector
          const barcodeDetector = new window.BarcodeDetector({
            formats: ['ean_13', 'code_128', 'qr_code', 'ean_8', 'upc_a'],
          });
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            handleExecuteScan(rawValue);
          }
        } catch {
          // ignore frame scan errors
        }
      }
    }, 450);
  };

  // Hardware scanner keyboard listener (rapid sequence ending in Enter)
  useEffect(() => {
    if (!isOpen) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is typing inside the manual input, don't hijack unless it's Enter
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length > 2) {
          handleExecuteScan(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        // High speed characters typically come from a hardware barcode wedge scanner (<40ms per char)
        if (timeDiff > 70 && !isInput) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, actionType, targetBranchId, quantity, selectedLotNumber]);

  const handleExecuteScan = (codeToScan: string) => {
    const clean = codeToScan.trim();
    if (!clean) return;

    const res = onProcessScan(
      clean,
      actionType,
      targetBranchId,
      quantity,
      selectedLotNumber || undefined
    );

    if (res.success) {
      soundService.playBarcodeBeep();
      if (actionType !== 'LOOKUP') {
        confetti({
          particleCount: 30,
          spread: 45,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#059669'],
        });
      }
    } else {
      soundService.playAlertBuzz();
    }

    setLastScannedResult({
      product: res.product,
      success: res.success,
      message: res.message,
      timestamp: new Date().toLocaleTimeString(),
    });

    setManualCode('');
  };

  if (!isOpen) return null;

  // Filter lots belonging to the selected product if lookup has product
  const relevantLots = lastScannedResult?.product
    ? lots.filter((l) => l.productId === lastScannedResult.product?.id)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Lector de Código de Barras & Control de Stock
              </h2>
              <p className="text-xs text-slate-400">
                Escaneo por cámara, emulador láser o pistola física USB (EAN-13, Code 128, QR)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Modes & Configuration */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/40 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => setActionType('LOOKUP')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                actionType === 'LOOKUP'
                  ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Consulta Rápida</span>
            </button>
            <button
              onClick={() => setActionType('STOCK_IN')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                actionType === 'STOCK_IN'
                  ? 'bg-blue-500/15 border-blue-500/60 text-blue-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Ingreso / Recepción (+)</span>
            </button>
            <button
              onClick={() => setActionType('STOCK_OUT')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                actionType === 'STOCK_OUT'
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Despacho / Venta (-)</span>
            </button>
          </div>

          {/* Operation parameters when altering stock */}
          {actionType !== 'LOOKUP' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Sucursal de Impacto
                </label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Cantidad por Escaneo
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2.5 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Asignar a Lote (Opcional)
                </label>
                <select
                  value={selectedLotNumber}
                  onChange={(e) => setSelectedLotNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 truncate"
                >
                  <option value="">(Automático / FEFO)</option>
                  {lots.map((l) => (
                    <option key={l.id} value={l.lotNumber}>
                      {l.lotNumber} · Venc: {l.expirationDate}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* Camera Scanner Viewport */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black/60 min-h-[180px] sm:min-h-[220px] flex items-center justify-center">
            {cameraActive ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-[260px] object-cover"
                />
                
                {/* Laser scan animation overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-36 border-2 border-emerald-500/60 rounded-lg relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-bounce duration-700" />
                    <div className="absolute bottom-2 left-2 text-[10px] font-mono text-emerald-400/80 bg-black/60 px-1 rounded">
                      Enfocando código...
                    </div>
                  </div>
                </div>

                <button
                  onClick={stopCamera}
                  className="absolute top-3 right-3 px-3 py-1 bg-red-600/80 hover:bg-red-500 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-colors"
                >
                  Apagar Cámara
                </button>
              </div>
            ) : (
              <div className="text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-400">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-300 font-medium">
                    Escaneo en tiempo real mediante cámara del dispositivo
                  </p>
                  <p className="text-[11px] text-slate-500">
                    O utilice un lector láser de mano USB/Bluetooth (detecta automáticamente al disparar)
                  </p>
                </div>
                {cameraError && (
                  <p className="text-xs text-amber-400 max-w-sm mx-auto">{cameraError}</p>
                )}
                <button
                  onClick={startCamera}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Activar Cámara Web</span>
                </button>
              </div>
            )}
          </div>

          {/* Manual Input or Gun Scan Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteScan(manualCode);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ingresar o disparar con pistola láser (EAN-13, SKU)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Procesar Código
            </button>
          </form>

          {/* Last Scan Result Card */}
          {lastScannedResult && (
            <div
              className={`p-4 rounded-xl border ${
                lastScannedResult.success
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                  : 'bg-red-950/30 border-red-500/30 text-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {lastScannedResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {lastScannedResult.success ? 'Operación Exitosa' : 'Aviso de Escáner'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {lastScannedResult.timestamp}
                    </span>
                  </div>
                  <p className="text-xs">{lastScannedResult.message}</p>

                  {lastScannedResult.product && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">SKU</span>
                        <span className="font-mono font-bold text-white">
                          {lastScannedResult.product.sku}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Código EAN</span>
                        <span className="font-mono text-slate-300">
                          {lastScannedResult.product.barcode}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Precio Venta</span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          ${lastScannedResult.product.salePrice.toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Stock Total Red</span>
                        <span className="font-mono text-white font-bold">
                          {lastScannedResult.product.stocks.reduce((acc, s) => acc + s.available, 0)} u.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Fast Test Barcodes (Quick Simulator) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Batería de Pruebas Rápidas (Clic para simular escaneo láser)
              </span>
              <span className="text-[11px] text-slate-500">
                {products.length} productos en catálogo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {products.slice(0, 6).map((prod) => {
                const totalAvail = prod.stocks.reduce((acc, s) => acc + s.available, 0);
                return (
                  <button
                    key={prod.id}
                    onClick={() => handleExecuteScan(prod.barcode)}
                    className="flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg text-left transition-colors group"
                  >
                    <div className="space-y-0.5 truncate mr-2">
                      <div className="text-xs font-medium text-slate-200 group-hover:text-emerald-300 truncate">
                        {prod.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {prod.barcode} · <span className="text-slate-500">{prod.sku}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-semibold text-slate-300 block">
                        {totalAvail} u.
                      </span>
                      <span className="text-[10px] text-emerald-400/90 font-mono">
                        ${prod.salePrice.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Escáner listo para captura continua</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Cerrar Lector
          </button>
        </div>

      </div>
    </div>
  );
};
