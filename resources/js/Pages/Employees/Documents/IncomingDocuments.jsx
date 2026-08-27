import { useState } from "react";
import { router } from "@inertiajs/react";
import DocumentDetailsModal from "./DocumentDetailsModal";

export default function IncomingDocuments({ documents = [] }) {
    const [selectedDocument, setSelectedDocument] = useState(null);

    const handleReceived = () => {
        setSelectedDocument(null);

        router.reload({
            only: ["documents"],
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Incoming Documents
                        </h2>

                        <p className="text-sm text-slate-500">
                            Documents assigned to your section.
                        </p>
                    </div>

                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                        {documents.length} Pending
                    </span>
                </div>

                {documents.length > 0 ? (
                    <div className="space-y-3">
                        {documents.map((document) => (
                            <button
                                key={document.document_id}
                                type="button"
                                onClick={() => setSelectedDocument(document)}
                                className="w-full rounded-lg border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-slate-50"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-semibold text-slate-800">
                                            {document.tracking_number}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-600">
                                            {document.description}
                                        </p>

                                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                                            <span>
                                                From:{" "}
                                                <strong>
                                                    {
                                                        document.current_section
                                                            ?.section_name
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                Destination:{" "}
                                                <strong>
                                                    {
                                                        document
                                                            .destination_section
                                                            ?.section_name
                                                    }
                                                </strong>
                                            </span>
                                        </div>
                                    </div>

                                    <span className="shrink-0 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                        {document.status?.status_name ??
                                            "Pending"}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="py-10 text-center">
                        <p className="text-sm text-slate-400">
                            No incoming documents.
                        </p>
                    </div>
                )}
            </div>

            {selectedDocument && (
                <DocumentDetailsModal
                    document={selectedDocument}
                    onClose={() => setSelectedDocument(null)}
                    onReceived={handleReceived}
                />
            )}
        </>
    );
}
