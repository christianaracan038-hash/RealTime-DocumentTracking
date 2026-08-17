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

export default function History({ documents = [] }) {
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
                    {documents.map((document) => (
                        <div
                            key={document.document_id}
                            className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="font-semibold text-slate-800">
                                        {document.tracking_number}
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {document.description}
                                    </p>
                                </div>

                                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                    {document.status?.status_name}
                                </span>
                            </div>

                            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
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
                                                        {history.from_section
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
                                                            {
                                                                history.employee
                                                                    ?.username
                                                            }
                                                        </strong>
                                                    </p>

                                                    {history.remarks && (
                                                        <p className="mt-2 text-xs text-slate-500">
                                                            {history.remarks}
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
                    ))}
                </div>
            </div>
        </EmployeeLayout>
    );
}
