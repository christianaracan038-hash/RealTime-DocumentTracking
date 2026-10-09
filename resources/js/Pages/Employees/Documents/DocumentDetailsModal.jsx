import { useState } from "react";
import { router } from "@inertiajs/react";

import ReceiveDocumentScanner from "./RecieveDocumentScanner";
import ForwardDocumentModal from "./ForwardDocumentModal";
import DocumentComments from "@/Components/Employee/Referrals/DocumentComments";
import {
    addressedTo,
    exactTime,
} from "@/Components/Employee/Referrals/referral";
import AgeBadge from "@/Components/Employee/AgeBadge";
import Icon from "@/Components/Employee/Icon";
import { useNotice } from "@/Components/Employee/Notice";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import { urgencyOf } from "@/Components/Employee/urgency";
import { waitedFor } from "@/Components/Employee/Referrals/referral";
import { sectionLabel } from "@/Components/Employee/Referrals/referral";

export default function DocumentDetailsModal({ document, onClose }) {
    const [showScanner, setShowScanner] = useState(false);
    const [showForwardModal, setShowForwardModal] = useState(false);

    const [confirmingComplete, setConfirmingComplete] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [completeError, setCompleteError] = useState(null);

    const { notify } = useNotice();

    if (!document) {
        return null;
    }

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
    const isArchived = status === "Archived";
    const isClosed = isCompleted || isArchived;

    const complete = async () => {
        setCompleting(true);
        setCompleteError(null);

        try {
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
    const isForArchiving = status === "For Archiving";
    const isAwaitingReceipt = isPending || isForArchiving;

    const urgency = urgencyOf(document);

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/70 p-4 sm:items-center">
                <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface shadow-2xl">
                    <div
                        className={`px-6 py-5 text-white ${
                            isAwaitingReceipt
                                ? (urgency?.band ?? "bg-navy-900")
                                : "bg-navy-900"
                        }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold tracking-widest uppercase opacity-90">
                                    {isForArchiving
                                        ? "Waiting for you to receive · For archiving"
                                        : isPending
                                          ? "Waiting for you to receive"
                                          : isReceived
                                            ? "On your desk"
                                            : "Document"}
                                </p>

                                <h2 className="mt-1 text-2xl font-bold">
                                    {document.taxpayer_name ??
                                        "No taxpayer on record"}
                                </h2>

                                <p className="mt-1 font-mono text-sm opacity-90">
                                    {document.tracking_number}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white"
                            >
                                <Icon name="close" />
                            </button>
                        </div>

                        {isAwaitingReceipt && document.aging && (
                            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-white/15 px-4 py-3">
                                <Icon
                                    name={urgency?.icon ?? "date"}
                                    className="text-xl"
                                />

                                <p className="text-base font-semibold">
                                    Waiting {waitedFor(document.aging.hours)}
                                    {document.aging.overdue
                                        ? " - past the two-day limit"
                                        : ""}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 px-6 py-5">
                        <DocumentComments document={document} />

                        <div className="grid grid-cols-2 gap-4">
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
                                          : isForArchiving
                                            ? "bg-amber-100 text-amber-800"
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

                            {document.archived_at && (
                                <div>
                                    <p className="text-xs font-medium text-slate-400">
                                        Archived
                                    </p>
                                    <p className="text-slate-700">
                                        {exactTime(document.archived_at)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {isAwaitingReceipt && (
                        <div className="border-t border-line bg-sunken px-6 py-5">
                            {isForArchiving && (
                                <p className="mb-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    This document was forwarded for archiving.
                                    It will be archived as soon as you receive
                                    it.
                                </p>
                            )}

                            <EmployeeButton
                                size="lg"
                                onClick={() => setShowScanner(true)}
                                className="w-full"
                            >
                                <Icon name="scan" />
                                {isForArchiving
                                    ? "Scan QR to receive and archive"
                                    : "Scan QR to receive this document"}
                            </EmployeeButton>

                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 w-full text-base font-medium text-muted transition hover:text-navy-900"
                            >
                                Not now
                            </button>
                        </div>
                    )}

                    {isReceived && !confirmingComplete && (
                        <div className="flex flex-col-reverse gap-3 border-t border-line bg-sunken px-6 py-5 sm:flex-row sm:justify-end">
                            <EmployeeButton variant="quiet" onClick={onClose}>
                                Close
                            </EmployeeButton>

                            <EmployeeButton
                                variant="secondary"
                                onClick={() => setConfirmingComplete(true)}
                            >
                                <Icon name="complete" />
                                Mark as completed
                            </EmployeeButton>

                            <EmployeeButton
                                onClick={() => setShowForwardModal(true)}
                            >
                                <Icon name="forward" />
                                Forward
                            </EmployeeButton>
                        </div>
                    )}

                    {isClosed && (
                        <div className="border-t border-line bg-sunken px-6 py-5">
                            <EmployeeButton
                                variant="quiet"
                                onClick={onClose}
                                className="w-full"
                            >
                                Close
                            </EmployeeButton>
                        </div>
                    )}

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

            {showScanner && (
                <ReceiveDocumentScanner
                    document={document}
                    mode="receive"
                    onClose={() => setShowScanner(false)}
                    onReceived={(received) =>
                        received?.status?.status_name === "Archived"
                            ? finish(
                                  "Document archived",
                                  "Received and moved to the archive. No further movement is possible.",
                                  [
                                      [
                                          "From",
                                          sectionLabel(
                                              document.current_section,
                                          ),
                                      ],
                                  ],
                              )
                            : finish(
                                  "Document received",
                                  "It is now on your desk.",
                                  [
                                      [
                                          "From",
                                          sectionLabel(
                                              document.current_section,
                                          ),
                                      ],
                                  ],
                              )
                    }
                />
            )}

            {showForwardModal && (
                <ForwardDocumentModal
                    document={document}
                    onClose={() => setShowForwardModal(false)}
                    onForwarded={(forwarded, section) => {
                        const forArchiving =
                            forwarded?.status?.status_name === "For Archiving";

                        finish(
                            forArchiving
                                ? "Forwarded for archiving"
                                : "Document forwarded",
                            forArchiving
                                ? "It will be archived once Admin receives it."
                                : "The receiving section will scan it in.",
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
                        );
                    }}
                />
            )}
        </>
    );
}
