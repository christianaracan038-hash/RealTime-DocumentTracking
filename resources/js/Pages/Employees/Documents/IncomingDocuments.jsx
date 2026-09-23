import { useState } from "react";

import DocumentDetailsModal from "./DocumentDetailsModal";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import EmployeeBadge from "@/Components/Employee/EmployeeBadge";
import AgeBadge from "@/Components/Employee/AgeBadge";
import Icon from "@/Components/Employee/Icon";
import { urgencyOf } from "@/Components/Employee/urgency";
import {
    addressedTo,
    exactTime,
    forwardedBy,
} from "@/Components/Employee/Referrals/referral";

/*
 * The receiving queue.
 *
 * Urgency colours the whole row - a thick spine down its left edge and
 * a wash behind it - rather than sitting in a badge in the corner. The
 * point is that someone glancing at the screen from a metre away can
 * see there is something red on it without reading a word.
 */
export default function IncomingDocuments({ documents = [] }) {
    const [selectedDocument, setSelectedDocument] = useState(null);

    const needingAttention = documents.filter(
        (document) => document.aging?.overdue,
    ).length;

    return (
        <>
            <EmployeeCard>
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-navy-900">
                            Waiting for you to receive
                        </h2>

                        <p className="mt-1 text-base text-muted">
                            Referrals sent to your section. Open one, then scan
                            its QR code to accept it.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {needingAttention > 0 && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-stop-600 px-4 py-1.5 text-base font-bold text-white">
                                <Icon name="warning" />
                                {needingAttention} overdue
                            </span>
                        )}

                        {documents.length > 0 && (
                            <span className="rounded-full bg-navy-900 px-4 py-1.5 text-base font-bold text-white">
                                {documents.length} waiting
                            </span>
                        )}
                    </div>
                </div>

                {documents.length > 0 ? (
                    <ul className="space-y-3">
                        {documents.map((document) => {
                            const urgency = urgencyOf(document);

                            return (
                                <li key={document.document_id}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedDocument(document)
                                        }
                                        className={`flex w-full overflow-hidden rounded-xl border text-left transition hover:border-brand-600 hover:shadow-md hover:shadow-navy-900/10 ${
                                            document.aging?.overdue
                                                ? "border-stop-600"
                                                : "border-line"
                                        } ${urgency?.card ?? "bg-white"}`}
                                    >
                                        {/* The urgency reads before any text does */}
                                        <span
                                            aria-hidden="true"
                                            className={`w-1.5 shrink-0 self-stretch ${
                                                urgency?.spine ?? "bg-navy-200"
                                            }`}
                                        />

                                        <div className="min-w-0 flex-1 p-5">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <p className="text-lg font-bold text-navy-900">
                                                    {document.taxpayer_name ??
                                                        "No taxpayer on record"}
                                                </p>

                                                <AgeBadge document={document} />
                                            </div>

                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <span className="rounded-lg bg-white/70 px-2.5 py-1 font-mono text-sm font-medium text-muted ring-1 ring-line">
                                                    {document.tracking_number}
                                                </span>

                                                {(document.concern ??
                                                    document.transaction_type) && (
                                                    <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-sm font-medium text-brand-700">
                                                        {document.concern ??
                                                            document.transaction_type}
                                                    </span>
                                                )}

                                                {document.referred_for && (
                                                    <span className="rounded-lg bg-white/70 px-2.5 py-1 text-sm font-medium text-navy-800 ring-1 ring-line">
                                                        For:{" "}
                                                        {document.referred_for}
                                                    </span>
                                                )}

                                                {document.awaiting_details && (
                                                    <span className="rounded-lg bg-accent-400 px-2.5 py-1 text-sm font-bold text-navy-900">
                                                        Awaiting details
                                                    </span>
                                                )}
                                            </div>

                                            {(document.remarks ??
                                                document.description) && (
                                                <p className="mt-3 text-base text-navy-800">
                                                    {document.remarks ??
                                                        document.description}
                                                </p>
                                            )}

                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                                <p className="text-sm text-muted">
                                                    From{" "}
                                                    <span className="font-semibold text-navy-800">
                                                        {forwardedBy(
                                                            document,
                                                        ) || "-"}
                                                    </span>
                                                    {document.addressee && (
                                                        <>
                                                            {" "}
                                                            &middot; addressed
                                                            to{" "}
                                                            <span className="font-semibold text-navy-800">
                                                                {addressedTo(
                                                                    document,
                                                                )}
                                                            </span>
                                                        </>
                                                    )}
                                                </p>

                                                <EmployeeBadge
                                                    status={
                                                        document.status
                                                            ?.status_name
                                                    }
                                                />
                                            </div>

                                            <p className="mt-2 text-sm text-muted">
                                                Sent{" "}
                                                {exactTime(
                                                    document.waiting_since,
                                                )}
                                            </p>
                                        </div>

                                        <span className="flex items-center self-stretch pr-4 text-muted">
                                            <Icon name="next" />
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="rounded-xl border border-dashed border-line py-14 text-center">
                        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-ok-100 text-2xl text-ok-600">
                            <Icon name="check" />
                        </span>

                        <p className="text-lg font-semibold text-navy-800">
                            Nothing waiting right now
                        </p>

                        <p className="mt-1 text-base text-muted">
                            Referrals sent to your section will appear here.
                        </p>
                    </div>
                )}
            </EmployeeCard>

            {selectedDocument && (
                <DocumentDetailsModal
                    document={selectedDocument}
                    onClose={() => setSelectedDocument(null)}
                />
            )}
        </>
    );
}
