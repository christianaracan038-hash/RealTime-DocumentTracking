import { useState } from "react";
import { router } from "@inertiajs/react";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import DocumentQrModal from "@/Components/Employee/Documents/DocumentQrModal";

export default function RecentDocumentsTable({ documents }) {
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [search, setSearch] = useState("");

    const documentData = documents?.data ?? [];

    const formatPhilippineDate = (date) => {
        if (!date) return "-";

        return new Intl.DateTimeFormat("en-PH", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(new Date(date));
    };

    const filteredDocuments = documentData.filter((document) => {
        const keyword = search.toLowerCase().trim();

        if (!keyword) {
            return true;
        }

        return (
            document.tracking_number?.toLowerCase().includes(keyword) ||
            document.description?.toLowerCase().includes(keyword) ||
            document.destination_section?.section_name
                ?.toLowerCase()
                .includes(keyword) ||
            document.status?.status_name?.toLowerCase().includes(keyword)
        );
    });

    const goToPage = (url) => {
        if (!url) return;

        router.visit(url, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <EmployeeCard>
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Recent Registered Documents
                        </h2>

                        <p className="text-sm text-slate-500">
                            Documents you've recently registered.
                        </p>
                    </div>

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-64 rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b bg-slate-50">
                                <th className="px-4 py-3 text-left">
                                    Tracking Number
                                </th>

                                <th className="px-4 py-3 text-left">
                                    Description
                                </th>

                                <th className="px-4 py-3 text-left">
                                    Destination
                                </th>

                                <th className="px-4 py-3 text-center">
                                    Status
                                </th>

                                <th className="px-4 py-3 text-center">
                                    QR Code
                                </th>

                                <th className="px-4 py-3 text-center">Date</th>

                                <th className="px-4 py-3 text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredDocuments.length > 0 ? (
                                filteredDocuments.map((document) => (
                                    <tr
                                        key={document.document_id}
                                        className="border-b hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3">
                                            {document.tracking_number}
                                        </td>

                                        <td className="px-4 py-3">
                                            {document.description}
                                        </td>

                                        <td className="px-4 py-3">
                                            {document.destination_section
                                                ?.section_name ?? "-"}
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    document.status
                                                        ?.status_color ===
                                                    "green"
                                                        ? "bg-green-100 text-green-700"
                                                        : document.status
                                                                ?.status_color ===
                                                            "blue"
                                                          ? "bg-blue-100 text-blue-700"
                                                          : document.status
                                                                  ?.status_color ===
                                                              "red"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {document.status?.status_name ??
                                                    "Unknown"}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            <img
                                                src={`/${document.qr_path}`}
                                                alt={`QR Code for ${document.tracking_number}`}
                                                className="mx-auto h-14 w-14 rounded border"
                                            />
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            {formatPhilippineDate(
                                                document.created_at,
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedDocument(
                                                        document,
                                                    )
                                                }
                                                className="rounded bg-blue-600 px-3 py-1 text-white transition hover:bg-blue-700"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="py-10 text-center text-slate-400"
                                    >
                                        No registered documents found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {documents?.links?.length > 0 && (
                    <div className="mt-5 flex items-center justify-between border-t pt-4">
                        <p className="text-sm text-slate-500">
                            Showing{" "}
                            <span className="font-medium">
                                {documents.from ?? 0}
                            </span>{" "}
                            to{" "}
                            <span className="font-medium">
                                {documents.to ?? 0}
                            </span>{" "}
                            of{" "}
                            <span className="font-medium">
                                {documents.total ?? 0}
                            </span>{" "}
                            documents
                        </p>

                        <div className="flex items-center gap-1">
                            {documents.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => goToPage(link.url)}
                                    className={`rounded-lg px-3 py-2 text-sm transition ${
                                        link.active
                                            ? "bg-blue-600 text-white"
                                            : link.url
                                              ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                              : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </EmployeeCard>

            {selectedDocument && (
                <DocumentQrModal
                    document={selectedDocument}
                    onClose={() => setSelectedDocument(null)}
                />
            )}
        </>
    );
}
