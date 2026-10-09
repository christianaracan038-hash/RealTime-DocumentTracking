import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function ReceiveDocumentScanner({
    document: documentRecord,
    onClose,
    onReceived,
    onForwarded,
    mode = "receive",
}) {
    const scannerRef = useRef(null);
    const isProcessingRef = useRef(false);
    const isMountedRef = useRef(true);

    const isForward = mode === "forward";
    const isForArchiving = Number(documentRecord?.status_id) === 5;

    const stopCamera = async (alsoClear = false) => {
        const scanner = scannerRef.current;

        if (!scanner) return;

        try {
            await scanner.stop();
        } catch {}

        if (!alsoClear) return;

        try {
            scanner.clear();
        } catch {}
    };

    const errorText = (err, fallback) =>
        (typeof err === "string" ? err : err?.message) || fallback;

    const [cameraError, setCameraError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState(null);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [archived, setArchived] = useState(false);

    const notify = (type, message, duration = 3000) => {
        setToast({ type, message });
        setTimeout(() => {
            if (isMountedRef.current) setToast(null);
        }, duration);
    };

    useEffect(() => {
        isMountedRef.current = true;

        const scannerId = "document-qr-reader";
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        const startScanner = async () => {
            try {
                setCameraError(null);

                const cameras = await Html5Qrcode.getCameras();

                if (!cameras || cameras.length === 0) {
                    throw new Error("No camera found.");
                }

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: (viewfinderWidth, viewfinderHeight) => {
                            const edge =
                                Math.min(viewfinderWidth, viewfinderHeight) *
                                0.7;
                            return { width: edge, height: edge };
                        },
                        aspectRatio: 1.0,
                    },
                    async (decodedText) => {
                        if (isProcessingRef.current) return;
                        isProcessingRef.current = true;

                        await stopCamera();

                        await handleScan(decodedText);
                    },
                    () => {},
                );
            } catch (err) {
                if (!isMountedRef.current) return;

                setCameraError(
                    errorText(
                        err,
                        "Unable to start the QR scanner. Please check your camera permission.",
                    ),
                );
            }
        };

        startScanner();

        return () => {
            isMountedRef.current = false;

            stopCamera(true).finally(() => {
                scannerRef.current = null;
            });
        };
    }, []);

    const getCsrfToken = () =>
        window.document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ?? null;

    const apiFetch = async (url, options = {}) => {
        const csrfToken = getCsrfToken();

        const response = await fetch(url, {
            ...options,
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
                ...(options.headers ?? {}),
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "An unexpected error occurred.");
        }

        return data;
    };

    const handleScan = (qrValue) => verifyDocument({ qr_value: qrValue }, "qr");

    const handleManualSubmit = async () => {
        const value = trackingNumber.trim();

        if (!value) {
            setError("Please enter a tracking number.");
            return;
        }

        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        await verifyDocument({ tracking_number: value }, "manual");
    };

    const verifyDocument = async (lookup, source) => {
        if (!isMountedRef.current) return;

        const isManual = source === "manual";

        try {
            setProcessing(true);
            setError(null);

            const scanData = await apiFetch("/api/documents/scan", {
                method: "POST",
                body: JSON.stringify({
                    ...lookup,
                    mode: isForward ? "forward" : "receive",
                }),
            });

            if (!isMountedRef.current) return;

            const scannedDocument = scanData.document;

            if (!scannedDocument?.document_id) {
                throw new Error(
                    isManual
                        ? "That tracking number did not return a valid document."
                        : "The scanned QR did not return a valid document.",
                );
            }

            if (
                String(scannedDocument.document_id) !==
                String(documentRecord.document_id)
            ) {
                throw new Error(
                    isManual
                        ? "That tracking number does not belong to this document."
                        : "The scanned QR code does not belong to this document.",
                );
            }

            await stopCamera();

            if (isForward) {
                if (!isMountedRef.current) return;

                setProcessing(false);
                setSuccess(true);
                notify("success", "Document verified successfully.");

                setTimeout(() => {
                    if (!isMountedRef.current) return;

                    if (onForwarded) {
                        onForwarded(scannedDocument, scanData.sections ?? []);
                    }
                }, 1200);

                return;
            }

            const actionData = await apiFetch(
                `/api/documents/${scannedDocument.document_id}/receive`,
                { method: "POST" },
            );

            if (!isMountedRef.current) return;

            setArchived(Boolean(actionData.archived));
            setSuccess(true);
            setProcessing(false);
            notify(
                "success",
                actionData.message ??
                    (actionData.archived
                        ? "Document received and archived successfully."
                        : "Document received successfully."),
            );

            if (onReceived) {
                onReceived(actionData.document);
            }

            setTimeout(() => {
                if (isMountedRef.current) {
                    onClose();
                }
            }, 1500);
        } catch (err) {
            if (!isMountedRef.current) return;

            const message = errorText(
                err,
                `Something went wrong while ${
                    isForward ? "validating" : "receiving"
                } the document.`,
            );

            setError(message);
            notify("error", message);

            setProcessing(false);
            isProcessingRef.current = false;
        }
    };

    if (!documentRecord) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-navy-950/80 p-4 sm:items-center">
            <style>{`
                @keyframes scan-progress-bar {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(150%); }
                    100% { transform: translateX(400%); }
                }
            `}</style>
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-xl">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {isForward
                                ? "Verify Document for Forwarding"
                                : isForArchiving
                                  ? "Receive Document for Archiving"
                                  : "Scan Document QR"}
                        </h2>

                        <p className="text-xs text-slate-500">
                            {documentRecord.taxpayer_name
                                ? documentRecord.taxpayer_name +
                                  " · " +
                                  documentRecord.tracking_number
                                : documentRecord.tracking_number}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="text-xl text-slate-400 hover:text-slate-700 disabled:opacity-50"
                    >
                        ×
                    </button>
                </div>

                <div className="p-5">
                    <div className="relative min-h-[280px] overflow-hidden rounded-xl bg-slate-900">
                        <div id="document-qr-reader" className="w-full" />

                        {processing && !success && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                                <div className="w-52 text-center text-white">
                                    <p className="text-sm font-medium">
                                        {isForward
                                            ? "Verifying document..."
                                            : "Processing document..."}
                                    </p>

                                    <div className="mx-auto mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                                        <div
                                            className="h-full w-1/3 rounded-full bg-white"
                                            style={{
                                                animation:
                                                    "scan-progress-bar 1.1s ease-in-out infinite",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="absolute inset-0 flex items-center justify-center bg-green-600/90">
                                <div className="text-center text-white">
                                    <div className="text-5xl">✓</div>
                                    <p className="mt-2 text-lg font-semibold">
                                        {isForward
                                            ? "Document Verified"
                                            : archived
                                              ? "Document Archived"
                                              : "Document Received"}
                                    </p>
                                    <p className="mt-1 text-sm text-green-100">
                                        {isForward
                                            ? "Loading destination sections..."
                                            : archived
                                              ? "Received and moved to the archive."
                                              : "Tracking history recorded."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {cameraError && !processing && !success && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-6 text-center">
                                <div>
                                    <p className="text-sm text-red-300">
                                        {cameraError}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-400">
                                        You can still enter the tracking number
                                        below.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {!success && !cameraError && !processing && !error && (
                        <p className="mt-4 text-center text-sm text-slate-500">
                            {isForward
                                ? "Scan the QR code attached to the physical document to verify it before forwarding."
                                : isForArchiving
                                  ? "This document was forwarded for archiving. Scan its QR code to receive it; it will be archived right after."
                                  : "Position the QR code attached to the physical document inside the scanner."}
                        </p>
                    )}

                    {error && (
                        <div className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {!success && (
                        <div className="mt-4 border-t pt-4">
                            <label
                                htmlFor="manual-tracking-number"
                                className="mb-1.5 block text-xs font-medium text-slate-600"
                            >
                                Can't scan the QR code? Enter the tracking
                                number instead.
                            </label>

                            <div className="flex gap-2">
                                <input
                                    id="manual-tracking-number"
                                    type="text"
                                    value={trackingNumber}
                                    onChange={(e) => {
                                        setTrackingNumber(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleManualSubmit();
                                        }
                                    }}
                                    placeholder="Tracking number"
                                    autoComplete="off"
                                    disabled={processing}
                                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none disabled:opacity-50"
                                />

                                <button
                                    type="button"
                                    onClick={handleManualSubmit}
                                    disabled={
                                        processing || !trackingNumber.trim()
                                    }
                                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isForward
                                        ? "Verify"
                                        : isForArchiving
                                          ? "Receive & Archive"
                                          : "Receive"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {toast && (
                <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4">
                    <div
                        className={`rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
                            toast.type === "error"
                                ? "bg-red-600"
                                : "bg-slate-900"
                        }`}
                    >
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}
