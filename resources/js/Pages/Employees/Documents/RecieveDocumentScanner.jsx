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

    /*
     * html5-qrcode's stop() and clear() THROW SYNCHRONOUSLY when the
     * scanner is not running - "Cannot stop, scanner is not running or
     * paused." That happens on the ordinary path: the decode callback
     * stops the camera, then the component unmounts and tries to stop
     * it again. A synchronous throw cannot be caught with .catch(), so
     * it escaped the cleanup function and crashed the React tree.
     */
    const stopCamera = async (alsoClear = false) => {
        const scanner = scannerRef.current;

        if (!scanner) return;

        try {
            await scanner.stop();
        } catch {
            // Already stopped, or never started. Nothing to do.
        }

        if (!alsoClear) return;

        try {
            scanner.clear();
        } catch {
            // Throws for the same reason; equally harmless.
        }
    };

    /*
     * The library throws plain strings, so err.message is undefined for
     * its own errors. Keep whichever of the two carries the reason.
     */
    const errorText = (err, fallback) =>
        (typeof err === "string" ? err : err?.message) || fallback;

    const [cameraError, setCameraError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

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

    const handleScan = async (qrValue) => {
        if (!isMountedRef.current) return;

        try {
            setProcessing(true);
            setError(null);

            const scanData = await apiFetch("/api/documents/scan", {
                method: "POST",
                body: JSON.stringify({
                    qr_value: qrValue,
                    mode: isForward ? "forward" : "receive",
                }),
            });

            if (!isMountedRef.current) return;

            const scannedDocument = scanData.document;

            if (!scannedDocument?.document_id) {
                throw new Error(
                    "The scanned QR did not return a valid document.",
                );
            }

            if (
                String(scannedDocument.document_id) !==
                String(documentRecord.document_id)
            ) {
                throw new Error(
                    "The scanned QR code does not belong to this document.",
                );
            }

            if (isForward) {
                if (!isMountedRef.current) return;

                setProcessing(false);

                if (onForwarded) {
                    onForwarded(scannedDocument, scanData.sections ?? []);
                }

                return;
            }

            const actionData = await apiFetch(
                `/api/documents/${scannedDocument.document_id}/receive`,
                { method: "POST" },
            );

            if (!isMountedRef.current) return;

            setSuccess(true);
            setProcessing(false);

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

            setError(
                errorText(
                    err,
                    `Something went wrong while ${
                        isForward ? "validating" : "receiving"
                    } the document.`,
                ),
            );

            setProcessing(false);
            isProcessingRef.current = false;
        }
    };

    if (!documentRecord) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-navy-950/80 p-4 sm:items-center">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {isForward
                                ? "Verify Document for Forwarding"
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
                    <div className="relative overflow-hidden rounded-xl bg-slate-900">
                        <div id="document-qr-reader" className="w-full" />

                        {processing && !success && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                                <div className="text-center text-white">
                                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                                    <p className="text-sm font-medium">
                                        {isForward
                                            ? "Verifying document..."
                                            : "Processing document..."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="absolute inset-0 flex items-center justify-center bg-green-600/90">
                                <div className="text-center text-white">
                                    <div className="text-5xl">✓</div>
                                    <p className="mt-2 text-lg font-semibold">
                                        Document Received
                                    </p>
                                    <p className="mt-1 text-sm text-green-100">
                                        Tracking history recorded.
                                    </p>
                                </div>
                            </div>
                        )}

                        {cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-6 text-center">
                                <p className="text-sm text-red-300">
                                    {cameraError}
                                </p>
                            </div>
                        )}
                    </div>

                    {!success && !cameraError && !processing && !error && (
                        <p className="mt-4 text-center text-sm text-slate-500">
                            {isForward
                                ? "Scan the QR code attached to the physical document to verify it before forwarding."
                                : "Position the QR code attached to the physical document inside the scanner."}
                        </p>
                    )}

                    {error && (
                        <div className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                            {error}
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
        </div>
    );
}
