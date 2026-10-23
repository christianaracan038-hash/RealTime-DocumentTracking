import { Head, Link, router, usePage } from "@inertiajs/react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

/*
 * Every referral a super admin has approved for deletion: who asked,
 * why, and who said yes. The referral itself stays in the register,
 * faded; this is the record of how it got that way.
 */

const when = (value) =>
    value
        ? new Date(value).toLocaleString("en-PH", {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : "—";

export default function DeletionHistory() {
    const { history } = usePage().props;

    const rows = history?.data ?? [];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-slate-900">
                            Deletion history
                        </h2>

                        <p className="text-sm text-slate-500">
                            Who requested each deletion, why, and who approved
                            it.
                        </p>
                    </div>

                    <Link
                        href={route("super.deletions.index")}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                        ← Pending requests
                    </Link>
                </div>
            }
        >
            <Head title="Deletion history" />

            <div className="bg-slate-50 py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {rows.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                            <p className="text-lg font-semibold text-slate-800">
                                No approved deletions yet.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {[
                                            "Reference",
                                            "Requested by",
                                            "Requested",
                                            "Reason",
                                            "Approved by",
                                            "Approved",
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className="px-4 py-3 text-left font-semibold text-slate-700"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200">
                                    {rows.map((row) => (
                                        <tr
                                            key={row.document_id}
                                            className="align-top"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                                                {row.tracking_number}
                                            </td>

                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                {row.requested_by ?? "—"}
                                            </td>

                                            <td className="px-4 py-3 text-slate-600">
                                                {when(
                                                    row.deletion_requested_at,
                                                )}
                                            </td>

                                            <td className="max-w-md whitespace-pre-wrap px-4 py-3 text-slate-900">
                                                {row.deletion_reason}
                                            </td>

                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                {row.approved_by ?? "—"}
                                            </td>

                                            <td className="px-4 py-3 text-slate-600">
                                                {when(row.deletion_approved_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {history?.links?.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {history.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url &&
                                        router.visit(link.url, {
                                            preserveScroll: true,
                                        })
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                        link.active
                                            ? "border-indigo-600 bg-indigo-600 text-white"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
