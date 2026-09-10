import { router } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import SearchInput from "@/Components/Employee/SearchInput";

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

const getStatusClasses = (color) => {
    switch (color) {
        case "green":
            return "bg-green-100 text-green-700";

        case "blue":
            return "bg-blue-100 text-blue-700";

        case "red":
            return "bg-red-100 text-red-700";

        default:
            return "bg-yellow-100 text-yellow-700";
    }
};

export default function History({ documents, filters = {} }) {
    /*
     * ==========================================================
     * SEARCH
     *
     * The keyword is sent to the server and applied to the database
     * query before pagination, so a match is found even when the
     * document sits on page 3. Filtering here instead would only
     * ever search the rows already on screen.
     * ==========================================================
     */
    const documentData = documents?.data ?? [];

    /*
     * Pagination
     */
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
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Document History
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Track documents you created or documents that passed
                        through your section.
                    </p>
                </div>

                {/* Search */}
                <div className="mt-6 flex justify-end">
                    <div className="w-full sm:w-96">
                        <SearchInput
                            initialValue={filters.search}
                            placeholder="Search taxpayer name, type, tracking no..."
                        />
                    </div>
                </div>

                {/* Documents */}
                <div className="mt-6">
                    {documentData.length > 0 ? (
                        documentData.map((document) => (
                            <div
                                key={document.document_id}
                                className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                {/* Header */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        {/*
                                         * Taxpayer leads the card: during an
                                         * inquiry the employee knows the name,
                                         * not the tracking number.
                                         */}
                                        <h2 className="text-lg font-semibold text-slate-900">
                                            {document.taxpayer_name ??
                                                "No taxpayer on record"}
                                        </h2>

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

                                        <p className="mt-2 text-sm text-slate-500">
                                            {document.description}
                                        </p>
                                    </div>

                                    <span
                                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                            document.status?.status_color,
                                        )}`}
                                    >
                                        {document.status?.status_name ??
                                            "Unknown"}
                                    </span>
                                </div>

                                {/* Basic Information */}
                                <div className="mt-5 grid gap-4 border-t pt-4 text-sm md:grid-cols-2 lg:grid-cols-4">
                                    {/* Creator */}
                                    <div>
                                        <p className="text-xs font-medium text-slate-400">
                                            Created By
                                        </p>

                                        <p className="mt-1 font-medium text-slate-700">
                                            {document.creator?.username ?? "-"}
                                        </p>
                                    </div>

                                    {/* Current Section */}
                                    <div>
                                        <p className="text-xs font-medium text-slate-400">
                                            Current Section
                                        </p>

                                        <p className="mt-1 font-medium text-slate-700">
                                            {document.current_section
                                                ?.section_name ?? "-"}
                                        </p>
                                    </div>

                                    {/* Current Holder */}
                                    <div>
                                        <p className="text-xs font-medium text-slate-400">
                                            Current Holder
                                        </p>

                                        <p className="mt-1 font-medium text-slate-700">
                                            {document.current_employee?.username ?? "-"}
                                        </p>
                                    </div>

                                    {/* Destination */}
                                    <div>
                                        <p className="text-xs font-medium text-slate-400">
                                            Current Destination
                                        </p>

                                        <p className="mt-1 font-medium text-slate-700">
                                            {document.destination_section
                                                ?.section_name ?? "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* Reference Number */}
                                {document.reference_number && (
                                    <div className="mt-4 rounded-lg bg-slate-50 p-3">
                                        <p className="text-xs font-medium text-slate-400">
                                            Reference Number
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                            {document.reference_number}
                                        </p>
                                    </div>
                                )}

                                {/* Document Movement */}
                                <div className="mt-5 border-t pt-4">
                                    <h3 className="mb-4 text-sm font-semibold text-slate-700">
                                        Document Movement
                                    </h3>

                                    {document.tracking_histories?.length > 0 ? (
                                        <div className="space-y-3">
                                            {document.tracking_histories.map(
                                                (history, index) => (
                                                    <div
                                                        key={
                                                            history.tracking_history_id
                                                        }
                                                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                                                    >
                                                        {/* Movement Header */}
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                                                                    {index + 1}
                                                                </span>

                                                                <span className="font-semibold text-slate-700">
                                                                    {history.action ??
                                                                        "DOCUMENT MOVEMENT"}
                                                                </span>
                                                            </div>

                                                            <span className="text-xs text-slate-400">
                                                                {formatPhilippineDateTime(
                                                                    history.tracked_at,
                                                                )}
                                                            </span>
                                                        </div>

                                                        {/* From → To */}
                                                        <div className="mt-3 rounded-lg bg-white p-3">
                                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                                                <div className="flex-1">
                                                                    <p className="text-xs text-slate-400">
                                                                        From
                                                                    </p>

                                                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                                                        {history
                                                                            .from_section
                                                                            ?.section_name ??
                                                                            "-"}
                                                                    </p>
                                                                </div>

                                                                <div className="hidden text-slate-400 sm:block">
                                                                    →
                                                                </div>

                                                                <div className="flex-1">
                                                                    <p className="text-xs text-slate-400">
                                                                        To
                                                                    </p>

                                                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                                                        {history
                                                                            .to_section
                                                                            ?.section_name ??
                                                                            "-"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Processed By */}
                                                        <div className="mt-3">
                                                            <p className="text-xs text-slate-400">
                                                                Processed By
                                                            </p>

                                                            <p className="mt-1 text-sm font-medium text-slate-700">
                                                                {history
                                                                    .employee
                                                                    ?.username ??
                                                                    "-"}
                                                            </p>
                                                        </div>

                                                        {/* Status */}
                                                        {history.status
                                                            ?.status_name && (
                                                            <div className="mt-2">
                                                                <p className="text-xs text-slate-400">
                                                                    Status
                                                                </p>

                                                                <p className="mt-1 text-sm text-slate-600">
                                                                    {
                                                                        history
                                                                            .status
                                                                            .status_name
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Remarks */}
                                                        {history.remarks && (
                                                            <div className="mt-2">
                                                                <p className="text-xs text-slate-400">
                                                                    Remarks
                                                                </p>

                                                                <p className="mt-1 text-sm text-slate-600">
                                                                    {
                                                                        history.remarks
                                                                    }
                                                                </p>
                                                            </div>
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
                            <p className="text-sm font-medium text-slate-500">
                                No documents found.
                            </p>

                            {filters.search && (
                                <p className="mt-1 text-xs text-slate-400">
                                    Try another taxpayer name, transaction
                                    type, tracking number, section, or
                                    employee.
                                </p>
                            )}
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
