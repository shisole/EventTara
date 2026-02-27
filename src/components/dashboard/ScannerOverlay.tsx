"use client";

import type { Html5Qrcode } from "html5-qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

import { CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ScannerOverlayProps {
  onClose: () => void;
}

interface ScanResult {
  type: "success" | "warning" | "info" | "error";
  message: string;
  userName?: string;
  eventName?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  requiresConfirmation?: boolean;
  pendingBody?: Record<string, string>;
}

interface CheckinResponse {
  message?: string;
  error?: string;
  userName?: string;
  eventName?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  alreadyCheckedIn?: boolean;
  requiresConfirmation?: boolean;
}

async function fetchCheckin(
  body: Record<string, string | boolean>,
): Promise<{ status: number; ok: boolean; data: CheckinResponse }> {
  const res = await fetch("/api/checkins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- fetch .json() returns any; validated by CheckinResponse interface
  const data: CheckinResponse = await res.json();
  return { status: res.status, ok: res.ok, data };
}

export default function ScannerOverlay({ onClose }: ScannerOverlayProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [forceLoading, setForceLoading] = useState(false);

  const handleForceCheckin = useCallback(async () => {
    if (!result?.pendingBody) return;

    setForceLoading(true);
    try {
      const { ok, data } = await fetchCheckin({
        ...result.pendingBody,
        force: true,
      });

      if (ok) {
        setResult({
          type: data.alreadyCheckedIn ? "info" : "success",
          message: data.message ?? "Checked in!",
          userName: data.userName,
          eventName: data.eventName,
          paymentStatus: data.paymentStatus,
          paymentMethod: data.paymentMethod,
        });
      } else {
        setResult({
          type: "error",
          message: data.error ?? data.message ?? "Check-in failed",
        });
      }
    } catch {
      setResult({
        type: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setForceLoading(false);
    }
  }, [result?.pendingBody]);

  const handleDismissResult = useCallback(() => {
    setResult(null);
  }, []);

  const handleClose = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        /* scanner may already be stopped */
      }
      scannerRef.current = null;
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode: Html5QrcodeClass } = await import("html5-qrcode");
        if (!mounted) return;

        const scanner = new Html5QrcodeClass("fab-qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText: string) => {
            if (processingRef.current) return;
            processingRef.current = true;

            try {
              const parts = decodedText.split(":");
              if (parts[0] !== "eventtara" || parts[1] !== "checkin") {
                setResult({
                  type: "error",
                  message: "Invalid QR code format",
                });
                return;
              }

              const eventId = parts[2];
              const isCompanion = parts[3] === "companion";
              const body: Record<string, string> = { event_id: eventId };

              if (isCompanion) {
                body.companion_id = parts[4];
              } else {
                body.user_id = parts[3];
              }

              const { status, ok, data } = await fetchCheckin(body);

              if (status === 202) {
                // Unpaid warning -- requires confirmation
                setResult({
                  type: "warning",
                  message: data.message ?? "Payment pending",
                  userName: data.userName,
                  eventName: data.eventName,
                  paymentStatus: data.paymentStatus,
                  paymentMethod: data.paymentMethod,
                  requiresConfirmation: true,
                  pendingBody: body,
                });
              } else if (ok) {
                setResult({
                  type: data.alreadyCheckedIn ? "info" : "success",
                  message: data.message ?? "Checked in!",
                  userName: data.userName,
                  eventName: data.eventName,
                  paymentStatus: data.paymentStatus,
                  paymentMethod: data.paymentMethod,
                });
              } else {
                setResult({
                  type: "error",
                  message: data.error ?? data.message ?? "Check-in failed",
                });
              }
            } finally {
              setTimeout(() => {
                processingRef.current = false;
              }, 2000);
            }
          },
          () => {
            /* ignore scan errors */
          },
        );
      } catch (error: unknown) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : "Failed to start camera";
        setCameraError(message);
      }
    };

    void startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {
          /* noop */
        });
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h2 className="font-heading text-lg font-bold text-white">QR Check-in Scanner</h2>
        <button
          onClick={handleClose}
          className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
          aria-label="Close scanner"
        >
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Scanner area */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div id="fab-qr-reader" className="w-full max-w-sm overflow-hidden rounded-xl" />
      </div>

      {/* Camera error */}
      {cameraError && <p className="px-4 pb-2 text-center text-sm text-red-400">{cameraError}</p>}

      {/* Result card */}
      {result && (
        <div className="p-4">
          <div
            className={cn("mx-auto max-w-sm rounded-xl p-4 text-sm font-medium", {
              "bg-forest-50 text-forest-700 dark:bg-forest-900/30 dark:text-forest-300":
                result.type === "success",
              "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300":
                result.type === "info",
              "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300":
                result.type === "warning",
              "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300":
                result.type === "error",
            })}
          >
            <p>{result.message}</p>

            {result.eventName && <p className="mt-1 text-xs opacity-75">{result.eventName}</p>}

            {result.paymentStatus && (
              <p className="mt-1 text-xs">
                Payment: {result.paymentMethod ?? "N/A"} ({result.paymentStatus})
              </p>
            )}

            {result.requiresConfirmation ? (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleForceCheckin}
                  disabled={forceLoading}
                >
                  {forceLoading ? "Checking in..." : "Check In Anyway"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismissResult}
                  disabled={forceLoading}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                onClick={handleDismissResult}
                className="mt-2 text-xs underline opacity-75 hover:opacity-100"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
