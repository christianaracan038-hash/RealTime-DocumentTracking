import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function ReceiveDocumentScanner({
    document: documentRecord,
    onClose,
    onReceived,
}) {
    const scannerRef = useRef(null);
    const isProcessingRef = useRef(false);

    const [cameraError, setCameraError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const scannerId = "document-qr-reader";
        const scanner = new Html5Qrcode(scannerId);

        scannerRef.current = scanner;

        const startScanner = async () => {
            try {
                setCameraError(null);

                const cameras = await Html5Qrcode.getCameras();

                console.log("Available cameras:", cameras);

                if (!cameras || cameras.length === 0) {
                    throw new Error("No camera found.");
                }

                // Sa laptop, gamitin muna ang first available camera.
                const cameraId = cameras[0].id;

                console.log("Using camera:", cameras[0]);

                await scanner.start(
                    cameraId,
                    {
                        fps: 10,
                        qrbox: {
                            width: 250,
                            height: 250,
                        },
                        aspectRatio: 1.0,
                    },
                    async (decodedText) => {
                        console.log("🔥 QR DETECTED:", decodedText);

                        if (isProcessingRef.current) {
                            return;
                        }

                        isProcessingRef.current = true;

                        await handleReceive(decodedText);
                    },
                    (scanErrorMessage) => {
                        // Normal habang naghahanap ng QR.
                        // Huwag muna i-console.log dahil sobrang dami nito.
                    },
                );
            } catch (err) {
                console.error("QR scanner error:", err);

                setCameraError(
                    err.message ||
                        "Unable to start the QR scanner. Please check your camera permission.",
                );
            }
        };
        startScanner();

        return () => {
            if (scannerRef.current) {
                scannerRef.current
                    .stop()
                    .catch(() => {})
                    .finally(() => {
                        scannerRef.current?.clear();
                    });
            }
        };
    }, []);

    const handleReceive = async (qrValue) => {
        try {
            setProcessing(true);
            setError(null);

            const csrfToken = window.document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content");

            // STEP 1: Validate scanned QR
            const scanResponse = await fetch("/api/documents/scan", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({
                    qr_value: qrValue,
                }),
            });

            const scanData = await scanResponse.json();

            console.log("SCAN RESPONSE:", scanData);

            if (!scanResponse.ok) {
                throw new Error(
                    scanData.message || "Unable to validate document.",
                );
            }

            const scannedDocument = scanData.document;

            if (!scannedDocument?.document_id) {
                throw new Error(
                    "The scanned QR did not return a valid document.",
                );
            }

            // STEP 2: Make sure scanned QR belongs to opened document
            if (
                String(scannedDocument.document_id) !==
                String(documentRecord.document_id)
            ) {
                throw new Error(
                    "The scanned QR code does not belong to this document.",
                );
            }

            // STEP 3: Actually receive the document
            const receiveResponse = await fetch(
                `/api/documents/${scannedDocument.document_id}/receive`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                },
            );

            const receiveData = await receiveResponse.json();

            console.log("RECEIVE RESPONSE:", receiveData);

            if (!receiveResponse.ok) {
                throw new Error(
                    receiveData.message || "Unable to receive the document.",
                );
            }

            // STEP 4: Success
            setSuccess(true);
            setProcessing(false);

            if (onReceived) {
                onReceived(receiveData.document);
            }

            // STEP 5: Close after success
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            console.error("RECEIVE ERROR:", err);

            setError(
                err.message ||
                    "Something went wrong while receiving the document.",
            );

            setProcessing(false);
            isProcessingRef.current = false;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Scan Document QR
                        </h2>

                        <p className="text-xs text-slate-500">
                            {documentRecord.tracking_number}
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

                {/* Scanner */}
                <div className="p-5">
                    <div className="relative overflow-hidden rounded-xl bg-slate-900">
                        <div id="document-qr-reader" className="w-full" />

                        {/* Processing */}
                        {processing && !success && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                                <div className="text-center text-white">
                                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />

                                    <p className="text-sm font-medium">
                                        Verifying document...
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Success */}
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

                        {/* Camera error */}
                        {cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-6 text-center">
                                <p className="text-sm text-red-300">
                                    {cameraError}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Instruction */}
                    {!success && !cameraError && !processing && (
                        <p className="mt-4 text-center text-sm text-slate-500">
                            Position the QR code attached to the physical
                            document inside the scanner.
                        </p>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
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
