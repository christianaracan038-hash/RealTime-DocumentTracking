import { useState } from "react";
import { router } from "@inertiajs/react";

import ReceiveDocumentScanner from "./RecieveDocumentScanner";
import ForwardDocumentModal from "./ForwardDocumentModal";
import {
    addressedTo,
    exactTime,
} from "@/Components/Employee/Referrals/referral";
import AgeBadge from "@/Components/Employee/AgeBadge";
import { useNotice } from "@/Components/Employee/Notice";
import { sectionLabel } from "@/Components/Employee/Referrals/referral";

export default function DocumentDetailsModal({ document, onClose }) {
    const [showScanner, setShowScanner] = useState(false);
    const [showForwardModal, setShowForwardModal] = useState(false);

    // Completing is final, so it asks once before it acts.
    const [confirmingComplete, setConfirmingComplete] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [completeError, setCompleteError] = useState(null);

    const { notify } = useNotice();

    if (!document) {
        return null;
    }

    /*
     * Every action ends the same way: a formal notice saying what
     * happened, then the page data refreshes so the document moves to
     * where it now belongs.
     */
    const finish = (title, message, extra = []) => {
        notify({
            title,
            message,
            details: [
                ["Taxpayer", document.taxpayer_name],
                ["Reference no.", document.tracking_number],
                ...extra,
            ],
        });

        setShowScanner(false);
        setShowForwardModal(false);
        onClose();

        router.reload();
    };

    const status = document.status?.status_name;
    const isCompleted = status === "Completed";

    const complete = async () => {
        setCompleting(true);
        setCompleteError(null);

        try {
            // Same CSRF handling as the forward request.
            const csrfToken = window.document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content");

            const response = await fetch(
                `/api/documents/${document.document_id}/complete`,
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
                    },
                },
            );

            const body = await response.json();

            if (!response.ok) {
                throw new Error(body.message ?? "Could not complete.");
            }

            finish(
                "Document completed",
                "Its journey ends here. It stays in History.",
            );
        } catch (err) {
            setCompleteError(err.message);
            setCompleting(false);
        }
    };

    const isReceived = status === "Received";
    const isPending = status === "Pending";

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/70 p-4 sm:items-center">
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
                                Taxpayer
                            </p>

                            <p className="text-lg font-semibold text-slate-900">
                                {document.taxpayer_name ??
                                    "No taxpayer on record"}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-slate-400">
                                    Reference No.
                                </p>

                                <p className="font-semibold text-slate-800">
                                    {document.tracking_number}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-slate-400">
                                    Concern
                                </p>

                                <p className="text-slate-700">
                                    {document.concern ??
                                        document.transaction_type ??
                                        "—"}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Remarks
                            </p>

                            <p className="text-slate-700">
                                {document.remarks ?? document.description}
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
                                    To
                                </p>

                                <p className="text-slate-700">
                                    {addressedTo(document) || "—"}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Status
                            </p>

                            <span
                                className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                    isCompleted
                                        ? "bg-brand-100 text-brand-700"
                                        : isReceived
                                          ? "bg-green-100 text-green-700"
                                          : isPending
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-slate-100 text-slate-700"
                                }`}
                            >
                                {status ?? "Unknown"}
                            </span>

                            <div className="mt-2">
                                <AgeBadge document={document} showSince />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-slate-400">
                                    Registered
                                </p>
                                <p className="text-slate-700">
                                    {exactTime(document.created_at)}
                                </p>
                            </div>

                            {document.received_at && (
                                <div>
                                    <p className="text-xs font-medium text-slate-400">
                                        Received
                                    </p>
                                    <p className="text-slate-700">
                                        {exactTime(document.received_at)}
                                    </p>
                                </div>
                            )}

                            {document.completed_at && (
                                <div>
                                    <p className="text-xs font-medium text-slate-400">
                                        Completed
                                    </p>
                                    <p className="text-slate-700">
                                        {exactTime(document.completed_at)}
                                    </p>
                                </div>
                            )}
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

                        {/* Received: forward it on, or end its journey here */}
                        {isReceived && !confirmingComplete && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setConfirmingComplete(true)}
                                    className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                                >
                                    Mark as Completed
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowForwardModal(true)}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    Forward Document
                                </button>
                            </>
                        )}
                    </div>

                    {/* Confirm before completing - there is no undo */}
                    {isReceived && confirmingComplete && (
                        <div className="border-t bg-brand-50 px-6 py-5">
                            <p className="text-base font-semibold text-navy-900">
                                Mark this document as completed?
                            </p>

                            <p className="mt-1 text-sm text-navy-800">
                                This ends its journey here. It cannot be
                                received or forwarded afterwards, and will stay
                                in History.
                            </p>

                            {completeError && (
                                <p className="mt-3 text-sm font-medium text-stop-600">
                                    {completeError}
                                </p>
                            )}

                            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    disabled={completing}
                                    onClick={() => setConfirmingComplete(false)}
                                    className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50"
                                >
                                    Go back
                                </button>

                                <button
                                    type="button"
                                    disabled={completing}
                                    onClick={complete}
                                    className="min-h-11 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                                >
                                    {completing
                                        ? "Completing..."
                                        : "Yes, mark as completed"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Receive Scanner */}
            {showScanner && (
                <ReceiveDocumentScanner
                    document={document}
                    mode="receive"
                    onClose={() => setShowScanner(false)}
                    onReceived={() =>
                        finish("Document received", "It is now on your desk.", [
                            ["From", sectionLabel(document.current_section)],
                        ])
                    }
                />
            )}

            {/* Forward Modal */}
            {showForwardModal && (
                <ForwardDocumentModal
                    document={document}
                    onClose={() => setShowForwardModal(false)}
                    onForwarded={(forwarded, section) =>
                        finish(
                            "Document forwarded",
                            "The receiving section will scan it in.",
                            [
                                [
                                    "To",
                                    section
                                        ? sectionLabel(section)
                                        : sectionLabel(
                                              forwarded?.destination_section,
                                          ),
                                ],
                            ],
                        )
                    }
                />
            )}
        </>
    );
}
