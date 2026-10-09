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
 * Print and Export share one toolbar. The section chips drive both:
 * picking a section changes what gets printed and what gets exported.
 * "All sections" only applies to the export, so printing is paused
 * while it is selected (a transmittal sheet is always for one section).
 *
 * Printing renders the sheet a second time into #print-root under
 * <body>, the same way the reference slip does; the print stylesheet
 * hides everything else.
 *
 * All text on light grounds is black, by request of the office: grey
 * text was hard to read on older monitors.
 */

const formatDate = (value) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

const chipClass = (active) =>
    `inline-flex min-h-12 items-center gap-2 rounded-xl px-4 py-2 text-base font-semibold transition ${
        active
            ? "bg-navy-900 text-white"
            : "bg-sunken text-black hover:bg-brand-50"
    }`;

const dateInputClass =
    "mt-1 block min-h-12 w-full rounded-xl border border-line px-3 text-base text-black";

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

    const exportingAll = allSections || !toSection;
    const canPrint = documents.length > 0 && !allSections;

    const invalidRange =
        range.from !== "" && range.until !== "" && range.from > range.until;

    const hasDates = range.from !== "" || range.until !== "";

    const scopeLabel = exportingAll ? "all sections" : sectionLabel(toSection);

    let summary = ` ${scopeLabel}`;
    if (range.from && range.until) {
        summary = `Exporting ${formatDate(range.from)} – ${formatDate(range.until)} for ${scopeLabel}`;
    } else if (range.from) {
        summary = `Exporting from ${formatDate(range.from)} onward for ${scopeLabel}`;
    } else if (range.until) {
        summary = `Exporting up to ${formatDate(range.until)} for ${scopeLabel}`;
    }

    const choose = (sectionId) => {
        setAllSections(false);

        if (toSection?.section_id === sectionId) return;

        router.get(
            route("transmittal.index"),
            { to: sectionId },
            { preserveState: true, preserveScroll: true },
        );
    };

    const exportExcel = () => {
        if (invalidRange) return;

        const params = exportingAll ? {} : { to: toSection.section_id };
        if (range.from) params.from = range.from;
        if (range.until) params.until = range.until;

        window.location.assign(route("transmittal.export", params));
    };

    return (
        <EmployeeLayout title="Transmittal">
            <div className="space-y-6">
                <EmployeeCard>
                    {/* Header: title on the left, both actions on the right */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-black">
                                Transmittal and Reports
                            </h2>
                        </div>

                        <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
                            {documents.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    disabled={!canPrint}
                                    title={
                                        canPrint
                                            ? undefined
                                            : "Choose one section to print its sheet."
                                    }
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-navy-900 bg-white px-5 text-base font-semibold text-black transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <Icon name="print" />
                                    Print sheet
                                </button>
                            )}

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
                    </div>

                    <div className="my-6 border-t border-line" />

                    {/* Section: shared by print and export */}
                    {destinations.length > 0 ? (
                        <div>
                            <p className="text-base font-semibold text-black">
                                Section
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                                {destinations.map((section) => {
                                    const current =
                                        !allSections &&
                                        toSection?.section_id ===
                                            section.section_id;

                                    return (
                                        <button
                                            key={section.section_id}
                                            type="button"
                                            onClick={() =>
                                                choose(section.section_id)
                                            }
                                            aria-pressed={current}
                                            className={chipClass(current)}
                                        >
                                            {sectionLabel(section)}

                                            <span
                                                className={`rounded-full px-2 py-0.5 text-sm font-bold ${
                                                    current
                                                        ? "bg-accent-400 text-black"
                                                        : "bg-navy-200 text-black"
                                                }`}
                                            >
                                                {section.waiting}
                                            </span>
                                        </button>
                                    );
                                })}

                                {toSection && (
                                    <button
                                        type="button"
                                        onClick={() => setAllSections(true)}
                                        aria-pressed={allSections}
                                        className={chipClass(allSections)}
                                    >
                                        All sections
                                    </button>
                                )}
                            </div>

                            {allSections && documents.length > 0 && (
                                <p className="mt-2 text-sm text-black">
                                    “All sections” applies only to the Excel
                                    export. Choose one section to print its
                                    transmittal sheet.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-line py-10 text-center">
                            <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-ok-100 text-2xl text-ok-600">
                                <Icon name="check" />
                            </span>

                            <p className="text-lg font-semibold text-black">
                                Nothing is waiting to be sent.
                            </p>

                            <p className="mt-1 text-base text-black">
                                A document appears here once it is addressed to
                                another section, and stays until that section
                                scans it in. You can still export a report
                                below.
                            </p>
                        </div>
                    )}

                    {/* Report dates */}
                    <div className="mt-6">
                        <p className="text-base font-semibold text-black">
                            Registered between
                        </p>

                        <div className="mt-1 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end lg:max-w-2xl">
                            <label className="block">
                                <span className="text-sm text-black">From</span>
                                <input
                                    type="date"
                                    value={range.from}
                                    max={range.until || undefined}
                                    onChange={(e) =>
                                        setRange((r) => ({
                                            ...r,
                                            from: e.target.value,
                                        }))
                                    }
                                    className={dateInputClass}
                                />
                            </label>

                            <span className="hidden pb-3 text-base text-black sm:block">
                                to
                            </span>

                            <label className="block">
                                <span className="text-sm text-black">To</span>
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
                                    className={dateInputClass}
                                />
                            </label>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                            {invalidRange ? (
                                <p className="text-base font-semibold text-red-600">
                                    The “From” date must be on or before the
                                    “To” date.
                                </p>
                            ) : (
                                <p className="text-base text-black">
                                    {summary}
                                </p>
                            )}

                            {hasDates && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setRange({ from: "", until: "" })
                                    }
                                    className="text-base font-semibold text-black underline underline-offset-4 hover:text-brand-700"
                                >
                                    Clear dates
                                </button>
                            )}
                        </div>
                    </div>
                </EmployeeCard>

                {documents.length > 0 && (
                    <EmployeeCard>
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                            <h3 className="text-lg font-bold text-black">
                                {documents.length} Document
                                {documents.length === 1 ? "" : "s"} for{" "}
                                {sectionLabel(toSection)}
                            </h3>

                            <p className="text-base text-black">
                                Sorted oldest first
                            </p>
                        </div>

                        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                            {documents.map((document, index) => (
                                <li
                                    key={document.document_id}
                                    className="flex items-center gap-4 px-4 py-3"
                                >
                                    <span className="w-6 shrink-0 text-base font-bold text-black">
                                        {index + 1}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-lg font-bold text-black">
                                            {document.taxpayer_name ??
                                                "No taxpayer on record"}
                                        </p>

                                        <p className="mt-0.5 font-mono text-sm text-black">
                                            {document.tracking_number}
                                            {document.concern
                                                ? ` · ${document.concern}`
                                                : ""}
                                        </p>

                                        <p className="mt-0.5 text-sm text-black">
                                            Waiting since{" "}
                                            {exactTime(document.waiting_since)}
                                        </p>
                                    </div>

                                    <AgeBadge document={document} />
                                </li>
                            ))}
                        </ul>

                        {/* <p className="mt-4 text-base text-black">
                            A document is removed from this list as soon as{" "}
                            {sectionLabel(toSection)} scans it in, so the sheet
                            lists only what they have not yet received.
                        </p> */}
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
