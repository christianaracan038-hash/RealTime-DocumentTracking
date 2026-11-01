import { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const when = (value) =>
    value
        ? new Date(value).toLocaleString("en-PH", {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : "—";

const plain = (value) =>
    String(value ?? "")
        .replace(/[\u202f\u00a0]/g, " ")
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201c\u201d]/g, '"');

const dash = (value) => plain(value) || "-";

const COLUMNS = [
    "Reference",
    "Requested by",
    "Requested",
    "Reason",
    "Approved by",
    "Approved",
];

export default function DeletionHistory() {
    const { history } = usePage().props;

    const rows = history?.data ?? [];

    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState("");

    const exportPdf = async () => {
        if (rows.length === 0 || exporting) return;

        setExporting(true);
        setExportError("");

        try {
            const [{ jsPDF }, { default: autoTable }] = await Promise.all([
                import("jspdf"),
                import("jspdf-autotable"),
            ]);

            const doc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
            });

            const margin = 12;

            const printed = new Date().toLocaleString("en-PH", {
                dateStyle: "long",
                timeStyle: "short",
            });

            const from = history?.from ?? 1;
            const to = history?.to ?? rows.length;
            const total = history?.total ?? rows.length;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("BUREAU OF INTERNAL REVENUE", margin, 14);

            doc.setFontSize(16);
            doc.text("DELETION HISTORY", margin, 22);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(
                "Referrals approved for deletion: who asked, why, and who approved.",
                margin,
                28,
            );

            doc.text(plain(`Records ${from} to ${to} of ${total}`), 285, 20, {
                align: "right",
            });
            doc.text(plain(`Printed ${printed}`), 285, 26, { align: "right" });

            autoTable(doc, {
                startY: 33,
                margin: { left: margin, right: margin, bottom: 14 },
                head: [COLUMNS],
                body: rows.map((row) => [
                    dash(row.tracking_number),
                    dash(row.requested_by),
                    dash(when(row.deletion_requested_at)),
                    dash(row.deletion_reason),
                    dash(row.approved_by),
                    dash(when(row.deletion_approved_at)),
                ]),
                styles: {
                    font: "helvetica",
                    fontSize: 8,
                    cellPadding: 2,
                    valign: "top",
                    overflow: "linebreak",
                    lineColor: [203, 213, 225],
                    lineWidth: 0.1,
                },
                headStyles: {
                    fillColor: [30, 41, 59],
                    textColor: 255,
                    fontStyle: "bold",
                },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    0: { cellWidth: 40, font: "courier", fontStyle: "bold" },
                    1: { cellWidth: 36 },
                    2: { cellWidth: 34 },
                    3: { cellWidth: "auto" },
                    4: { cellWidth: 36 },
                    5: { cellWidth: 34 },
                },
                rowPageBreak: "avoid",
            });

            const pages = doc.getNumberOfPages();

            for (let page = 1; page <= pages; page += 1) {
                doc.setPage(page);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.text(
                    `Page ${page} of ${pages}`,
                    285,
                    doc.internal.pageSize.getHeight() - 7,
                    { align: "right" },
                );
            }

            doc.save(
                `deletion-history-${new Date().toLocaleDateString("en-CA")}.pdf`,
            );
        } catch {
            setExportError("Could not create the PDF. Please try again.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-slate-900">
                            Deletion history
                        </h2>

                        <p className="text-sm text-slate-500">
                            Who requested each deletion, why, and who approved
                            it.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            type="button"
                            onClick={exportPdf}
                            disabled={rows.length === 0 || exporting}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {exporting ? "Preparing..." : "Export PDF"}
                        </button>

                        <Link
                            href={route("super.deletions.index")}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            ← Pending requests
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Deletion history" />

            <div className="bg-slate-50 py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {exportError && (
                        <p
                            role="alert"
                            className="text-sm font-semibold text-red-600"
                        >
                            {exportError}
                        </p>
                    )}

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
                                        {COLUMNS.map((heading) => (
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
