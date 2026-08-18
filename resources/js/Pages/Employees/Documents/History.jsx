import { router } from "@inertiajs/react";
import EmployeeLayout from "@/Layouts/EmployeeLayouts";

const formatPhilippineDateTime = (date) => {
    if (!date) return "-";

    return new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    }).format(new Date(date));
};

export default function History({ documents }) {
    const documentData = documents?.data ?? [];

    const goToPage = (url) => {
        if (!url) return;

        router.visit(url, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <EmployeeLayout title="Document History">
            <div className="p-6">
                <h1 className="text-2xl font-semibold text-slate-900">
                    Document History
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Track the current location and movement history of your
                    documents.
                </p>

                <div className="mt-6">
                    {documentData.length > 0 ? (
                        documentData.map((document) => (
                            <div
                                key={document.document_id}
                                className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="font-semibold text-slate-800">
                                            {document.tracking_number}
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {document.description}
                                        </p>
                                    </div>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            document.status?.status_color ===
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
                                </div>

                                {/* Current document location */}
                                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                                    <div>
                                        <p className="text-slate-400">
                                            Current Section
                                        </p>

                                        <p className="font-medium text-slate-700">
                                            {document.current_section
                                                ?.section_name ?? "-"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-slate-400">
                                            Destination
                                        </p>

                                        <p className="font-medium text-slate-700">
                                            {document.destination_section
                                                ?.section_name ?? "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* Tracking History */}
                                <div className="mt-5 border-t pt-4">
                                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                                        Tracking History
                                    </h3>

                                    {document.tracking_histories?.length > 0 ? (
                                        <div className="space-y-3">
                                            {document.tracking_histories.map(
                                                (history) => (
                                                    <div
                                                        key={
                                                            history.tracking_history_id
                                                        }
                                                        className="rounded-lg bg-slate-50 p-4"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-slate-700">
                                                                {history.action}
                                                            </span>

                                                            <span className="text-xs text-slate-400">
                                                                {formatPhilippineDateTime(
                                                                    history.tracked_at,
                                                                )}
                                                            </span>
                                                        </div>

                                                        <p className="mt-2 text-sm text-slate-600">
                                                            {history
                                                                .from_section
                                                                ?.section_name ??
                                                                "-"}{" "}
                                                            →{" "}
                                                            {history.to_section
                                                                ?.section_name ??
                                                                "-"}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Received by:{" "}
                                                            <strong>
                                                                {history
                                                                    .employee
                                                                    ?.username ??
                                                                    "-"}
                                                            </strong>
                                                        </p>

                                                        {history.remarks && (
                                                            <p className="mt-2 text-xs text-slate-500">
                                                                {
                                                                    history.remarks
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400">
                                            No tracking history yet.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                            <p className="text-sm text-slate-400">
                                No documents found.
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {documents?.links?.length > 0 && (
                    <div className="mt-6 flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
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

                        <div className="flex flex-wrap items-center gap-1">
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
            </div>
        </EmployeeLayout>
    );
}
