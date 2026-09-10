import { useState } from "react";
import DocumentDetailsModal from "./DocumentDetailsModal";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import EmployeeBadge from "@/Components/Employee/EmployeeBadge";

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
                            Documents sent to your section. Open one, then scan
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
                            <button
                                key={document.document_id}
                                type="button"
                                onClick={() => setSelectedDocument(document)}
                                className="w-full rounded-lg border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-slate-50"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            {document.taxpayer_name ??
                                                "No taxpayer on record"}
                                        </p>

                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                                {document.tracking_number}
                                            </span>

                                            {document.transaction_type && (
                                                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                                                    {document.transaction_type}
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-2 text-sm text-slate-600">
                                            {document.description}
                                        </p>

                                                {document.transaction_type && (
                                                    <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-sm font-medium text-brand-700">
                                                        {
                                                            document.transaction_type
                                                        }
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-3 text-base text-navy-800">
                                                {document.description}
                                            </p>

                                            <p className="mt-2 text-sm text-muted">
                                                From{" "}
                                                <span className="font-semibold text-navy-800">
                                                    {document.current_section
                                                        ?.section_name ?? "-"}
                                                </span>
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
                            Documents sent to your section will appear here.
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
