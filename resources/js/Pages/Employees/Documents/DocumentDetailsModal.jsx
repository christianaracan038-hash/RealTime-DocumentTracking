import { useState } from "react";

import ReceiveDocumentScanner from "./RecieveDocumentScanner";
import ForwardDocumentModal from "./ForwardDocumentModal";

export default function DocumentDetailsModal({ document, onClose }) {
    const [showScanner, setShowScanner] = useState(false);
    const [showForwardModal, setShowForwardModal] = useState(false);

    if (!document) {
        return null;
    }

    const status = document.status?.status_name;

    const isReceived = status === "Received";
    const isPending = status === "Pending";

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Document Details
                        </h2>

                        <button
                            type="button"
                            onClick={onClose}
                            className="text-xl text-slate-400 hover:text-slate-700"
                        >
                            ×
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4 px-6 py-5">
                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Tracking Number
                            </p>

                            <p className="font-semibold text-slate-800">
                                {document.tracking_number}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Description
                            </p>

                            <p className="text-slate-700">
                                {document.description}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Reference Number
                            </p>

                            <p className="text-slate-700">
                                {document.reference_number || "—"}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-slate-400">
                                    From
                                </p>

                                <p className="text-slate-700">
                                    {document.current_section?.section_name ??
                                        "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-slate-400">
                                    Destination
                                </p>

                                <p className="text-slate-700">
                                    {document.destination_section
                                        ?.section_name ?? "—"}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Status
                            </p>

                            <span
                                className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                    isReceived
                                        ? "bg-green-100 text-green-700"
                                        : isPending
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-slate-100 text-slate-700"
                                }`}
                            >
                                {status ?? "Unknown"}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 border-t px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        {/* Pending */}
                        {isPending && (
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                            >
                                Receive Document
                            </button>
                        )}

                        {/* Received */}
                        {isReceived && (
                            <button
                                type="button"
                                onClick={() => setShowForwardModal(true)}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                Forward Document
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Receive Scanner */}
            {showScanner && (
                <ReceiveDocumentScanner
                    document={document}
                    mode="receive"
                    onClose={() => setShowScanner(false)}
                    onReceived={() => {
                        setShowScanner(false);
                        onClose();
                    }}
                />
            )}

            {/* Forward Modal */}
            {showForwardModal && (
                <ForwardDocumentModal
                    document={document}
                    onClose={() => setShowForwardModal(false)}
                />
            )}
        </>
    );
}
