import { useState } from "react";
import ReceiveDocumentScanner from "./RecieveDocumentScanner";

export default function DocumentDetailsModal({ document, onClose }) {
    const [showScanner, setShowScanner] = useState(false);

    if (!document) {
        return null;
    }

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
                                    {document.current_section?.section_name}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-slate-400">
                                    Destination
                                </p>

                                <p className="text-slate-700">
                                    {document.destination_section?.section_name}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Status
                            </p>

                            <span className="mt-1 inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                {document.status?.status_name ?? "Pending"}
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
                            Close
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowScanner(true)}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                        >
                            Receive Document
                        </button>
                    </div>
                </div>
            </div>

            {showScanner && (
                <ReceiveDocumentScanner
                    document={document}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </>
    );
}
