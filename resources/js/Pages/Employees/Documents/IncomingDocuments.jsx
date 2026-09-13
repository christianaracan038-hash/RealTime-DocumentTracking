import { useState } from "react";
import DocumentDetailsModal from "./DocumentDetailsModal";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import EmployeeBadge from "@/Components/Employee/EmployeeBadge";
import {
    addressedTo,
    sentFrom,
} from "@/Components/Employee/Referrals/referral";

export default function IncomingDocuments({ documents = [] }) {
    const [selectedDocument, setSelectedDocument] = useState(null);

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

                    {documents.length > 0 && (
                        <span className="rounded-full bg-accent-400 px-4 py-1.5 text-base font-bold text-navy-900">
                            {documents.length} waiting
                        </span>
                    )}
                </div>

                {documents.length > 0 ? (
                    <ul className="space-y-3">
                        {documents.map((document) => (
                            <li key={document.document_id}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedDocument(document)
                                    }
                                    className="w-full rounded-xl border border-line p-5 text-left transition hover:border-brand-600 hover:bg-brand-50"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-lg font-bold text-navy-900">
                                                {document.taxpayer_name ??
                                                    "No taxpayer on record"}
                                            </p>

                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <span className="rounded-lg bg-paper px-2.5 py-1 font-mono text-sm font-medium text-muted">
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
                                                    <span className="rounded-lg bg-paper px-2.5 py-1 text-sm font-medium text-navy-800">
                                                        For:{" "}
                                                        {document.referred_for}
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

                                            <p className="mt-2 text-sm text-muted">
                                                From{" "}
                                                <span className="font-semibold text-navy-800">
                                                    {sentFrom(document) || "-"}
                                                </span>
                                                {document.addressee && (
                                                    <>
                                                        {" "}
                                                        &middot; addressed to{" "}
                                                        <span className="font-semibold text-navy-800">
                                                            {addressedTo(
                                                                document,
                                                            )}
                                                        </span>
                                                    </>
                                                )}
                                            </p>
                                        </div>

                                        <EmployeeBadge
                                            status={
                                                document.status?.status_name
                                            }
                                        />
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="rounded-xl border border-dashed border-line py-14 text-center">
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
