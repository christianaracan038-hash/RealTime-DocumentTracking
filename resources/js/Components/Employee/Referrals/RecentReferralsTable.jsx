import { useState } from "react";
import { router } from "@inertiajs/react";

import EmployeeCard from "@/Components/Employee/EmployeeCard";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import EmployeeBadge from "@/Components/Employee/EmployeeBadge";
import AgeBadge from "@/Components/Employee/AgeBadge";
import SearchInput from "@/Components/Employee/SearchInput";
import ReferenceSlipModal from "./ReferenceSlipModal";
import { addressedTo, exactTime, longDate, sentFrom } from "./referral";

export default function RecentReferralsTable({
    documents,
    filters = {},
    only = ["documents", "filters"],
}) {
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
                            only={only}
                        />
                    </div>
                </div>

                {/*
                 * Phones and tablets: one card per referral, laid out in the
                 * same order as the printed slip. Eleven columns cannot be
                 * read on a narrow screen even with sideways scrolling.
                 */}
                <ul className="space-y-3 lg:hidden">
                    {rows.length > 0 ? (
                        rows.map((document) => (
                            <li
                                key={document.document_id}
                                className="rounded-xl border border-line p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-lg font-bold text-navy-900">
                                            {document.taxpayer_name ??
                                                "No taxpayer on record"}
                                        </p>
                                        <p className="mt-0.5 font-mono text-sm text-muted">
                                            {document.tracking_number}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                        <EmployeeBadge
                                            status={
                                                document.status?.status_name
                                            }
                                        />
                                        <AgeBadge document={document} />
                                    </div>
                                </div>

                                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-base">
                                    <dt className="text-sm font-semibold text-muted">
                                        Concerns
                                    </dt>
                                    <dd className="text-navy-800">
                                        {document.concern ??
                                            document.transaction_type ??
                                            "—"}
                                    </dd>

                                    <dt className="text-sm font-semibold text-muted">
                                        For
                                    </dt>
                                    <dd className="text-navy-800">
                                        {document.referred_for ?? "—"}
                                    </dd>

                                    <dt className="text-sm font-semibold text-muted">
                                        To
                                    </dt>
                                    <dd className="text-navy-800">
                                        {addressedTo(document) || "—"}
                                    </dd>

                                    <dt className="text-sm font-semibold text-muted">
                                        From
                                    </dt>
                                    <dd className="text-navy-800">
                                        {sentFrom(document) || "—"}
                                    </dd>

                                    <dt className="text-sm font-semibold text-muted">
                                        Date
                                    </dt>
                                    <dd className="text-navy-800">
                                        {longDate(document.document_date)}
                                    </dd>

                                    <dt className="text-sm font-semibold text-muted">
                                        Registered
                                    </dt>
                                    <dd className="text-navy-800">
                                        {exactTime(document.created_at)}
                                    </dd>

                                    {(document.remarks ??
                                        document.description) && (
                                        <>
                                            <dt className="text-sm font-semibold text-muted">
                                                Remarks
                                            </dt>
                                            <dd className="text-navy-800">
                                                {document.remarks ??
                                                    document.description}
                                            </dd>
                                        </>
                                    )}
                                </dl>

                                <EmployeeButton
                                    variant="secondary"
                                    onClick={() => setSlipFor(document)}
                                    className="mt-4 w-full"
                                >
                                    View slip
                                </EmployeeButton>
                            </li>
                        ))
                    ) : (
                        <li className="rounded-xl border border-dashed border-line py-12 text-center">
                            <p className="text-lg font-semibold text-navy-800">
                                No referrals yet
                            </p>
                            <p className="mt-1 text-base text-muted">
                                {filters.search
                                    ? "Nothing matches that search."
                                    : "Referrals you register will appear here."}
                            </p>
                        </li>
                    )}
                </ul>

                {/* Desktop: the full table */}
                <div className="hidden overflow-x-auto rounded-xl border border-line lg:block">
                    <table className="min-w-full">
                        <thead className="bg-paper">
                            <tr>
                                <th className={th}>Taxpayer</th>
                                <th className={th}>Concerns</th>
                                <th className={th}>For</th>
                                <th className={th}>Remarks</th>
                                <th className={th}>From</th>
                                <th className={th}>To</th>
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
                                            <p className="text-sm text-muted">
                                                Registered{" "}
                                                {exactTime(document.created_at)}
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
                                            <div className="flex flex-col items-start gap-2">
                                                <EmployeeBadge
                                                    status={
                                                        document.status
                                                            ?.status_name
                                                    }
                                                />
                                                <AgeBadge document={document} />
                                            </div>
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
                                        colSpan="10"
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

                        <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
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
