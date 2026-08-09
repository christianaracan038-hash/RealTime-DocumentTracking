import EmployeeCard from "@/Components/Employee/EmployeeCard";

export default function RecentDocumentsTable({ documents = [] }) {
    return (
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

                            <th className="px-4 py-3 text-left">Description</th>

                            <th className="px-4 py-3 text-left">Destination</th>

                            <th className="px-4 py-3 text-center">Status</th>

                            <th className="px-4 py-3 text-center">QR Code</th>

                            <th className="px-4 py-3 text-center">Date</th>

                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {documents.length > 0 ? (
                            documents.map((document) => (
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
                                                    ?.status_color === "green"
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
                                            alt="QR Code"
                                            className="mx-auto h-14 w-14 rounded border"
                                        />
                                    </td>

                                    <td className="px-4 py-3 text-center">
                                        {document.created_at}
                                    </td>

                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button className="rounded bg-blue-600 px-3 py-1 text-white">
                                                View
                                            </button>

                                            <button className="rounded bg-green-600 px-3 py-1 text-white">
                                                Download
                                            </button>
                                        </div>
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
        </EmployeeCard>
    );
}
