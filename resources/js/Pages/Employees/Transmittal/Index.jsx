import { useState } from "react";
import { createPortal } from "react-dom";
import { router } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import AgeBadge from "@/Components/Employee/AgeBadge";
import TransmittalSheet from "@/Components/Employee/Referrals/TransmittalSheet";
import {
    exactTime,
    sectionLabel,
} from "@/Components/Employee/Referrals/referral";

/*
 * Handing a stack of documents to another section.
 *
 * The list is not chosen - it is everything the system already says is on
 * its way to that section and has not been received. Letting somebody
 * tick a subset would mean the paper and the system could disagree,
 * which is the one thing a receipt must never do.
 *
 * Printing renders the sheet a second time into #print-root under
 * <body>, the same way the reference slip does; the print stylesheet
 * hides everything else.
 */
export default function Index({
    documents = [],
    destinations = [],
    toSection = null,
    fromSection = null,
    releasedBy = null,
    filters = {},
}) {
    const [range, setRange] = useState({
        from: filters.from ?? "",
        until: filters.until ?? "",
    });
    const [allSections, setAllSections] = useState(false);

    const invalidRange =
        range.from !== "" && range.until !== "" && range.from > range.until;

    const choose = (sectionId) =>
        router.get(
            route("transmittal.index"),
            { to: sectionId },
            { preserveState: true, preserveScroll: true },
        );

    const exportExcel = () => {
        if (invalidRange) return;

        const params =
            allSections || !toSection ? {} : { to: toSection.section_id };
        if (range.from) params.from = range.from;
        if (range.until) params.until = range.until;

        window.location.assign(route("transmittal.export", params));
    };

    return (
        <EmployeeLayout title="Transmittal">
            <div className="space-y-6">
                <EmployeeCard>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-navy-900">
                                Transmittal sheet
                            </h2>

                            <p className="mt-1 text-base text-muted">
                                The paper that goes with the documents. Print
                                it, walk the stack over, and have the receiving
                                section sign it.
                            </p>
                        </div>

                        {documents.length > 0 && (
                            <EmployeeButton
                                size="lg"
                                onClick={() => window.print()}
                                className="w-full shrink-0 lg:w-auto"
                            >
                                <Icon name="print" />
                                Print sheet
                            </EmployeeButton>
                        )}
                    </div>

                    {destinations.length > 0 ? (
                        <>
                            <p className="mt-6 text-base font-semibold text-navy-800">
                                Going to
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                                {destinations.map((section) => {
                                    const current =
                                        toSection?.section_id ===
                                        section.section_id;

                                    return (
                                        <button
                                            key={section.section_id}
                                            type="button"
                                            onClick={() =>
                                                choose(section.section_id)
                                            }
                                            aria-current={
                                                current ? "true" : undefined
                                            }
                                            className={`inline-flex min-h-12 items-center gap-2 rounded-xl px-4 py-2 text-base font-semibold transition ${
                                                current
                                                    ? "bg-navy-900 text-white"
                                                    : "bg-sunken text-navy-800 hover:bg-brand-50"
                                            }`}
                                        >
                                            {sectionLabel(section)}

                                            <span
                                                className={`rounded-full px-2 py-0.5 text-sm font-bold ${
                                                    current
                                                        ? "bg-accent-400 text-navy-900"
                                                        : "bg-navy-200 text-navy-900"
                                                }`}
                                            >
                                                {section.waiting}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="mt-6 rounded-xl border border-dashed border-line py-14 text-center">
                            <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-ok-100 text-2xl text-ok-600">
                                <Icon name="check" />
                            </span>

                            <p className="text-lg font-semibold text-navy-800">
                                Nothing waiting to go out
                            </p>

                            <p className="mt-1 text-base text-muted">
                                A document appears here once it has been
                                addressed to another section and before that
                                section scans it in.
                            </p>
                        </div>
                    )}
                </EmployeeCard>

                <EmployeeCard>
                    <h3 className="text-lg font-bold text-navy-900">
                        Export to Excel
                    </h3>

                    <p className="mt-1 text-base text-muted">
                        Pick a date range based on when each document was
                        registered. Leave both dates empty to export everything.
                    </p>

                    {toSection && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {[
                                [false, sectionLabel(toSection)],
                                [true, "All sections"],
                            ].map(([value, label]) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => setAllSections(value)}
                                    aria-pressed={allSections === value}
                                    className={`min-h-12 rounded-xl px-4 py-2 text-base font-semibold transition ${
                                        allSections === value
                                            ? "bg-navy-900 text-white"
                                            : "bg-sunken text-navy-800 hover:bg-brand-50"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
                        <label className="block">
                            <span className="text-base font-semibold text-navy-800">
                                From
                            </span>
                            <input
                                type="date"
                                value={range.from}
                                min={range.from || undefined}
                                onChange={(e) =>
                                    setRange((r) => ({
                                        ...r,
                                        from: e.target.value,
                                    }))
                                }
                                className="mt-1 block min-h-12 w-full rounded-xl border border-line px-3 text-base text-navy-900"
                            />
                        </label>

                        <label className="block">
                            <span className="text-base font-semibold text-navy-800">
                                To
                            </span>
                            <input
                                type="date"
                                value={range.until}
                                min={range.from || undefined}
                                onChange={(e) =>
                                    setRange((r) => ({
                                        ...r,
                                        until: e.target.value,
                                    }))
                                }
                                className="mt-1 block min-h-12 w-full rounded-xl border border-line px-3 text-base text-navy-900"
                            />
                        </label>

                        <button
                            type="button"
                            onClick={() => setRange({ from: "", until: "" })}
                            disabled={!range.from && !range.until}
                            className="min-h-12 rounded-xl px-4 text-base font-semibold text-navy-800 hover:bg-brand-50 disabled:opacity-40"
                        >
                            Clear dates
                        </button>

                        <EmployeeButton
                            size="lg"
                            onClick={exportExcel}
                            disabled={invalidRange}
                            className="w-full lg:w-auto"
                        >
                            <Icon name="download" />
                            Export to Excel
                        </EmployeeButton>
                    </div>

                    {invalidRange && (
                        <p className="mt-3 text-base font-semibold text-red-600">
                            The "From" date must be on or before the "To" date.
                        </p>
                    )}
                </EmployeeCard>

                {documents.length > 0 && (
                    <EmployeeCard>
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                            <h3 className="text-lg font-bold text-navy-900">
                                {documents.length} document
                                {documents.length === 1 ? "" : "s"} for{" "}
                                {sectionLabel(toSection)}
                            </h3>

                            <p className="text-base text-muted">Oldest first</p>
                        </div>

                        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                            {documents.map((document, index) => (
                                <li
                                    key={document.document_id}
                                    className="flex items-center gap-4 px-4 py-3"
                                >
                                    <span className="w-6 shrink-0 text-base font-bold text-muted">
                                        {index + 1}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-lg font-bold text-navy-900">
                                            {document.taxpayer_name ??
                                                "No taxpayer on record"}
                                        </p>

                                        <p className="mt-0.5 font-mono text-sm text-muted">
                                            {document.tracking_number}
                                            {document.concern
                                                ? ` · ${document.concern}`
                                                : ""}
                                        </p>

                                        <p className="mt-0.5 text-sm text-muted">
                                            Waiting since{" "}
                                            {exactTime(document.waiting_since)}
                                        </p>
                                    </div>

                                    <AgeBadge document={document} />
                                </li>
                            ))}
                        </ul>

                        <p className="mt-4 text-base text-muted">
                            A row leaves this list the moment{" "}
                            {sectionLabel(toSection)} scans it in, so the sheet
                            only ever lists what they have not yet received.
                        </p>
                    </EmployeeCard>
                )}
            </div>

            {/* The print copy, outside the app's own tree */}
            {documents.length > 0 &&
                createPortal(
                    <div id="print-root" className="hidden print:block">
                        <TransmittalSheet
                            documents={documents}
                            fromSection={fromSection}
                            toSection={toSection}
                            releasedBy={releasedBy}
                        />
                    </div>,
                    window.document.body,
                )}
        </EmployeeLayout>
    );
}
