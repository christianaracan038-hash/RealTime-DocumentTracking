import { useState } from "react";
import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import DocumentDetailsModal from "@/Pages/Employees/Documents/DocumentDetailsModal";
import AgeBadge from "@/Components/Employee/AgeBadge";
import Icon from "@/Components/Employee/Icon";
import DelayReasonModal from "@/Components/Employee/DelayReasonModal";
import { urgencyOf } from "@/Components/Employee/urgency";
import { exactTime } from "@/Components/Employee/Referrals/referral";

export default function Documents({ documents = [] }) {
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [noticeDocumentId, setNoticeDocumentId] = useState(null);

    const noticeDocument =
        documents.find((d) => d.document_id === noticeDocumentId) ?? null;

    return (
        <EmployeeLayout title="Documents">
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-black">
                        Documents
                    </h1>
                </div>

                <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-black">
                                My Documents
                            </h2>
                        </div>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-black">
                            {documents.length}{" "}
                            {documents.length === 1 ? "Document" : "Documents"}
                        </span>
                    </div>

                    {documents.length > 0 ? (
                        <div className="space-y-3">
                            {documents.map((document) => {
                                const urgency = urgencyOf(document);
                                const hasNotice = Boolean(
                                    document.delay_reason,
                                );

                                return (
                                    <div
                                        key={document.document_id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() =>
                                            setSelectedDocument(document)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.target !== e.currentTarget)
                                                return;

                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                e.preventDefault();
                                                setSelectedDocument(document);
                                            }
                                        }}
                                        className={`flex w-full cursor-pointer overflow-hidden rounded-xl border text-left transition hover:border-brand-600 hover:shadow-md hover:shadow-navy-900/10 ${
                                            document.aging?.overdue
                                                ? "border-stop-600"
                                                : "border-line"
                                        } ${urgency?.card ?? "bg-surface"}`}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`w-1.5 shrink-0 self-stretch ${
                                                urgency?.spine ?? "bg-navy-200"
                                            }`}
                                        />

                                        <div className="min-w-0 flex-1 p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="font-semibold text-black">
                                                        {document.taxpayer_name ??
                                                            "No taxpayer on record"}
                                                    </p>

                                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium text-black ring-1 ring-line">
                                                            {
                                                                document.tracking_number
                                                            }
                                                        </span>

                                                        {(document.concern ??
                                                            document.transaction_type) && (
                                                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-black">
                                                                {document.concern ??
                                                                    document.transaction_type}
                                                            </span>
                                                        )}

                                                        {hasNotice && (
                                                            <span className="rounded-full bg-accent-400 px-2.5 py-0.5 text-xs font-bold text-black">
                                                                Notice added
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="mt-2 text-sm text-black">
                                                        {document.remarks ??
                                                            document.description}
                                                    </p>

                                                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-black">
                                                        <span>
                                                            From:{" "}
                                                            <strong>
                                                                {document
                                                                    .current_section
                                                                    ?.section_name ??
                                                                    "-"}
                                                            </strong>
                                                        </span>

                                                        <span>
                                                            Destination:{" "}
                                                            <strong>
                                                                {document
                                                                    .destination_section
                                                                    ?.section_name ??
                                                                    "-"}
                                                            </strong>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 flex-col items-end gap-2">
                                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-black">
                                                        {document.status
                                                            ?.status_name ??
                                                            "Unknown"}
                                                    </span>

                                                    <AgeBadge
                                                        document={document}
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setNoticeDocumentId(
                                                                document.document_id,
                                                            );
                                                        }}
                                                        onKeyDown={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-stop-600 bg-white px-3 py-1.5 text-xs font-semibold text-stop-600 transition hover:bg-stop-600 hover:text-white"
                                                    >
                                                        <Icon name="warning" />
                                                        {hasNotice
                                                            ? "View notice"
                                                            : "Delay reason"}
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="mt-3 text-sm text-black">
                                                Received{" "}
                                                {exactTime(
                                                    document.received_at,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-sm text-black">
                                No documents are currently assigned to your
                                section.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {selectedDocument && (
                <DocumentDetailsModal
                    document={selectedDocument}
                    onClose={() => setSelectedDocument(null)}
                />
            )}

            {noticeDocument && (
                <DelayReasonModal
                    key={noticeDocument.document_id}
                    document={noticeDocument}
                    delayReason={noticeDocument.delay_reason ?? null}
                    open
                    onClose={() => setNoticeDocumentId(null)}
                />
            )}
        </EmployeeLayout>
    );
}
