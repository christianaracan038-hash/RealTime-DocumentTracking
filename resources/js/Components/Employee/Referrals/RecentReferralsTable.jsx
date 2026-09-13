import { useState } from "react";
import { router } from "@inertiajs/react";

import EmployeeCard from "@/Components/Employee/EmployeeCard";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import EmployeeBadge from "@/Components/Employee/EmployeeBadge";
import SearchInput from "@/Components/Employee/SearchInput";
import ReferenceSlipModal from "./ReferenceSlipModal";
import { addressedTo, longDate, sentFrom } from "./referral";

/*
 * Recent registered referrals.
 *
 * One row per referral, in the same order as the printed slip so the
 * clerk can check a row against the paper in their hand. "View slip"
 * opens the printable Form 2309 for that row.
 */
export default function RecentReferralsTable({ documents, filters = {} }) {
    const [slipFor, setSlipFor] = useState(null);

    // Already filtered by the database; do not filter again here.
    const rows = documents?.data ?? [];

    const goToPage = (url) => {
        if (!url) return;

        router.visit(url, { preserveState: true, preserveScroll: true });
    };

    const th =
        "px-4 py-3 text-left text-xs font-semibold tracking-wider text-muted uppercase whitespace-nowrap";
    const td = "px-4 py-4 align-top text-base text-navy-800";

    return (
        <>
            <EmployeeCard>
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-navy-900">
                            Recent registered referrals
                        </h2>

                        <p className="mt-1 text-base text-muted">
                            Referrals you registered, newest first.
                        </p>
                    </div>

                    <div className="w-full lg:w-96">
                        <SearchInput
                            label="Find a referral"
                            initialValue={filters.search}
                            placeholder="Taxpayer, concern, reference no..."
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-line">
                    <table className="min-w-full">
                        <thead className="bg-paper">
                            <tr>
                                <th className={th}>Taxpayer</th>
                                <th className={th}>Concern</th>
                                <th className={th}>For</th>
                                <th className={th}>Remarks</th>
                                <th className={th}>From</th>
                                <th className={th}>To</th>
                                <th className={th}>Office code</th>
                                <th className={th}>Reference no.</th>
                                <th className={`${th} text-center`}>QR</th>
                                <th className={th}>Status</th>
                                <th className={th}>
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-line">
                            {rows.length > 0 ? (
                                rows.map((document) => (
                                    <tr
                                        key={document.document_id}
                                        className="hover:bg-paper"
                                    >
                                        <td className={td}>
                                            <p className="font-bold text-navy-900">
                                                {document.taxpayer_name ??
                                                    "No taxpayer on record"}
                                            </p>
                                            <p className="mt-0.5 text-sm text-muted">
                                                {longDate(
                                                    document.document_date,
                                                )}
                                            </p>
                                        </td>

                                        <td className={td}>
                                            {document.concern ??
                                                document.transaction_type ??
                                                "—"}
                                        </td>

                                        <td className={td}>
                                            {document.referred_for ?? "—"}
                                        </td>

                                        <td className={`${td} max-w-xs`}>
                                            <p className="line-clamp-3">
                                                {document.remarks ??
                                                    document.description ??
                                                    "—"}
                                            </p>
                                        </td>

                                        <td
                                            className={`${td} whitespace-nowrap`}
                                        >
                                            {sentFrom(document)}
                                        </td>

                                        <td className={td}>
                                            {addressedTo(document)}
                                        </td>

                                        <td className={`${td} font-mono`}>
                                            {document.office_code ??
                                                document.creator?.section
                                                    ?.section_code ??
                                                "—"}
                                        </td>

                                        <td
                                            className={`${td} font-mono whitespace-nowrap`}
                                        >
                                            {document.tracking_number}
                                        </td>

                                        <td className={`${td} text-center`}>
                                            <img
                                                src={route(
                                                    "documents.qr",
                                                    document.document_id,
                                                )}
                                                alt=""
                                                className="mx-auto h-12 w-12"
                                            />
                                        </td>

                                        <td className={td}>
                                            <EmployeeBadge
                                                status={
                                                    document.status?.status_name
                                                }
                                            />
                                        </td>

                                        <td
                                            className={`${td} whitespace-nowrap`}
                                        >
                                            <EmployeeButton
                                                variant="secondary"
                                                onClick={() =>
                                                    setSlipFor(document)
                                                }
                                            >
                                                View slip
                                            </EmployeeButton>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="11"
                                        className="py-14 text-center"
                                    >
                                        <p className="text-lg font-semibold text-navy-800">
                                            No referrals yet
                                        </p>
                                        <p className="mt-1 text-base text-muted">
                                            {filters.search
                                                ? "Nothing matches that search."
                                                : "Referrals you register will appear here."}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {documents?.links?.length > 3 && (
                    <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-base text-muted">
                            Showing{" "}
                            <span className="font-semibold text-navy-900">
                                {documents.from ?? 0}–{documents.to ?? 0}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-navy-900">
                                {documents.total ?? 0}
                            </span>
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {documents.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => goToPage(link.url)}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`min-h-11 rounded-xl border px-4 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                        link.active
                                            ? "border-brand-600 bg-brand-600 text-white"
                                            : "border-line bg-white text-navy-800 hover:bg-paper"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </EmployeeCard>

            {slipFor && (
                <ReferenceSlipModal
                    document={slipFor}
                    onClose={() => setSlipFor(null)}
                />
            )}
        </>
    );
}
