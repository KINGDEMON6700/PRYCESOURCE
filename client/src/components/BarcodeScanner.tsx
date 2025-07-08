import { useEffect, useRef, useState } from "react";
import { X, Camera, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onBarcodeDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setIsScanning(true);
    } catch (error) {
      // Camera access error - show fallback UI
      setHasCamera(false);
      toast({
        title: "Erreur caméra",
        description: "Impossible d'accéder à la caméra. Vérifiez les permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const toggleFlash = async () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track && 'applyConstraints' in track) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flashOn } as any]
          });
          setFlashOn(!flashOn);
        } catch (error) {
          // Flash not supported
          toast({
            title: "Flash non supporté",
            description: "Ce dispositif ne supporte pas le flash.",
            variant: "destructive",
          });
        }
      }
    }
  };

  // Simulate barcode detection (you can integrate with ZXing or other libraries)
  const scanForBarcode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Here you would implement actual barcode scanning
      // For now, let's simulate with a manual input when clicking
      // This is where you'd integrate ZXing or similar library
    }
  };

  const handleManualInput = () => {
    const barcode = prompt("Scanner non disponible. Entrez le code-barres manuellement:");
    if (barcode && barcode.trim()) {
      onBarcodeDetected(barcode.trim());
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setFlashOn(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen && hasCamera) {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      interval = setInterval(scanForBarcode, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] bg-gray-900 border-gray-700 p-0">
        <div className="relative w-full h-full">
          {/* Header */}
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-white flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Scanner de code-barres
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          {/* Camera View */}
          {hasCamera ? (
            <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2">
                  <div className="mx-auto w-64 h-32 border-2 border-white/60 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                    
                    {/* Scanning line */}
                    <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-blue-400 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFlash}
                  className="bg-black/50 border-white/30 text-white hover:bg-white/20"
                >
                  {flashOn ? <ZapOff className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualInput}
                  className="bg-black/50 border-white/30 text-white hover:bg-white/20"
                >
                  Saisie manuelle
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 p-8 text-center">
              <Camera className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">Caméra non disponible</h3>
              <p className="text-gray-400 mb-4">
                Impossible d'accéder à la caméra. Vérifiez les permissions ou utilisez la saisie manuelle.
              </p>
              <Button onClick={handleManualInput} className="bg-blue-600 hover:bg-blue-700">
                Saisie manuelle
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}