import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { router, usePage } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import Icon from "@/Components/Employee/Icon";
import AgeBadge from "@/Components/Employee/AgeBadge";
import SearchInput from "@/Components/Employee/SearchInput";
import { useNotice } from "@/Components/Employee/Notice";
import { urgencyOf } from "@/Components/Employee/urgency";

import ReferralFormPanel from "@/Components/Employee/Referrals/ReferralFormPanel";
import SectionReferralPanel from "@/Components/Employee/Referrals/SectionReferralPanel";
import DetailsFormModal from "@/Components/Employee/Referrals/DetailsFormModal";
import DocumentTrailModal from "@/Components/Employee/Referrals/DocumentTrailModal";
import TransmittalSheet from "@/Components/Employee/Referrals/TransmittalSheet";
import {
    exactTime,
    sectionLabel,
} from "@/Components/Employee/Referrals/referral";

import SlipPdfSize from "@/Components/Employee/Referrals/SlipPdfSize";

const TABS = [
    {
        key: "",
        label: <span className="text-xl">All Referrals</span>,
        icon: "referrals",
        tone: "blue",
    },
    {
        key: "waiting",
        label: <span className="text-xl">Waiting for Details</span>,
        icon: "register",
        tone: "blue",
    },
    {
        key: "slip",
        label: <span className="text-xl">Slip Ready</span>,
        icon: "print",
        tone: "blue",
    },
];

const today = () => new Date().toLocaleDateString("en-CA");

const dateInputClass =
    "mt-1 block min-h-12 w-full rounded-xl border border-line bg-white px-3 text-base text-black sm:w-44";

function CountCard({ tab, count, current, onSelect }) {
    const acting = tab.tone === "act" && count > 0;

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-current={current ? "true" : undefined}
            className={`
                flex flex-col rounded-2xl border p-5 text-left
                bg-gradient-to-br from-navy-900 via-navy-800 to-blue-900
                border-white/10
                shadow-lg shadow-navy-900/10
                transition-all duration-300
                hover:from-navy-800 hover:via-navy-700 hover:to-blue-800
                ${current ? "ring-4 ring-blue-400/40 border-blue-300/50" : ""}
            `}
        >
            <span className="flex items-start justify-between gap-3">
                <span className="text-base font-semibold text-white">
                    {tab.label}
                </span>

                <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        acting
                            ? "bg-accent-400 text-black"
                            : "bg-white/15 text-white"
                    }`}
                >
                    <Icon name={tab.icon} />
                </span>
            </span>

            <span className="mt-2 block text-4xl font-bold text-white">
                {count}
            </span>

            <span className="mt-1 block text-sm text-blue-100">{tab.hint}</span>

            <span
                aria-hidden="true"
                className={`mt-3 block h-1 rounded-full transition ${
                    current ? "bg-white" : "bg-white/10"
                }`}
            />
        </button>
    );
}

const isComplete = (document) =>
    Boolean(document.completed_at) ||
    document.status?.status_name === "Completed";

function StatusPill({ document }) {
    if (isComplete(document)) {
        return (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ok-600 px-3 py-1 text-sm font-bold text-white">
                <Icon name="check" />
                Completed
            </span>
        );
    }

    if (document.details_completed_at) {
        return (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ok-600 px-3 py-1 text-sm font-bold text-white">
                <Icon name="check" />
                Slip ready
            </span>
        );
    }

    return (
        <span className="shrink-0 rounded-full bg-accent-100 px-3 py-1 text-sm font-bold text-black">
            Waiting for details
        </span>
    );
}

export default function Index({
    documents,
    counts = {},
    sections = [],
    referralOptions = {},
    fromSection = null,
    filters = {},
    frame = "list",
    openSlipFor = null,
    usesForm2309 = true,
    canCompleteDetails = false,
    reportDocuments = [],
    releasedBy = null,
}) {
    const [completing, setCompleting] = useState(null);

    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [reason, setReason] = useState("");
    const [reasonError, setReasonError] = useState("");

    const [registering, setRegistering] = useState(frame === "register");

    const [range, setRange] = useState({ from: today(), until: today() });
    const [loadingReport, setLoadingReport] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [emptyRange, setEmptyRange] = useState(false);

    const [opened, setOpened] = useState(
        openSlipFor ? { id: openSlipFor, slip: true } : null,
    );

    const { flash } = usePage().props;
    const { notify } = useNotice();

    const rows = documents?.data ?? [];

    const tabs = usesForm2309
        ? TABS
        : TABS.filter((tab) => tab.key !== "waiting");

    const invalidRange =
        range.from !== "" && range.until !== "" && range.from > range.until;

    const canPrint =
        range.from !== "" &&
        range.until !== "" &&
        !invalidRange &&
        !loadingReport &&
        !printing;

    useEffect(() => {
        if (!flash?.success) return;

        notify({ title: "Done", message: flash.success });
    }, [flash?.id]);

    useEffect(() => {
        if (!openSlipFor) return;

        setRegistering(false);
        setOpened({ id: openSlipFor, slip: true });
    }, [openSlipFor]);

    useEffect(() => {
        if (!printing) return;

        const done = () => setPrinting(false);
        window.addEventListener("afterprint", done);
        const timer = setTimeout(() => window.print(), 150);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("afterprint", done);
        };
    }, [printing]);

    const go = (params) =>
        router.get(route("referrals.index"), params, {
            preserveState: true,
            preserveScroll: true,
        });

    const showList = (status = filters.status ?? "") =>
        go({
            status: status || undefined,
            search: filters.search || undefined,
        });

    const printReport = () => {
        if (!canPrint) return;

        setEmptyRange(false);
        setLoadingReport(true);

        router.get(
            route("referrals.index"),
            {
                status: filters.status || undefined,
                search: filters.search || undefined,
                from: range.from,
                until: range.until,
                report: 1,
            },
            {
                only: ["reportDocuments", "releasedBy"],
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onSuccess: async (page) => {
                    const found = page.props.reportDocuments ?? [];

                    if (found.length === 0) {
                        setEmptyRange(true);
                        setLoadingReport(false);
                        return;
                    }

                    await Promise.all(
                        found.map(
                            (d) =>
                                new Promise((resolve) => {
                                    const img = new Image();
                                    img.onload = img.onerror = resolve;
                                    img.src = route(
                                        "documents.qr",
                                        d.document_id,
                                    );
                                }),
                        ),
                    );

                    setLoadingReport(false);
                    setPrinting(true);
                },
                onError: () => setLoadingReport(false),
            },
        );
    };

    const exportExcel = () => {
        if (!canPrint) return;

        window.location.assign(
            route("referrals.export", {
                from: range.from,
                until: range.until,
            }),
        );
    };

    const confirmDelete = () => {
        const text = reason.trim();

        if (text.length < 10) {
            setReasonError(
                "Please type the reason for deleting this referral (at least 10 characters).",
            );
            return;
        }

        router.post(
            route("referrals.section.request-deletion", deleting.document_id),
            { reason: text },
            {
                preserveScroll: true,
                onError: (errors) => setReasonError(errors.reason ?? ""),
                onSuccess: closeDelete,
            },
        );
    };

    const closeDelete = () => {
        setDeleting(null);
        setReason("");
        setReasonError("");
    };

    const closeForm = () => {
        setRegistering(false);
        setEditing(null);
    };

    return (
        <EmployeeLayout title="Referrals">
            <EmployeeCard>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <label className="block">
                            <span className="text-sm font-semibold text-black">
                                Report from
                            </span>
                            <input
                                type="date"
                                value={range.from}
                                max={range.until || undefined}
                                onChange={(e) => {
                                    setEmptyRange(false);
                                    setRange((r) => ({
                                        ...r,
                                        from: e.target.value,
                                    }));
                                }}
                                className={dateInputClass}
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-semibold text-black">
                                to
                            </span>
                            <input
                                type="date"
                                value={range.until}
                                min={range.from || undefined}
                                onChange={(e) => {
                                    setEmptyRange(false);
                                    setRange((r) => ({
                                        ...r,
                                        until: e.target.value,
                                    }));
                                }}
                                className={dateInputClass}
                            />
                        </label>

                        <EmployeeButton
                            size="lg"
                            variant="secondary"
                            onClick={printReport}
                            disabled={!canPrint}
                            className="w-full sm:w-auto"
                        >
                            <Icon name="print" />
                            {loadingReport || printing
                                ? "Preparing..."
                                : "Print report"}
                        </EmployeeButton>

                        <EmployeeButton
                            size="lg"
                            variant="secondary"
                            onClick={exportExcel}
                            disabled={!canPrint}
                            className="w-full sm:w-auto"
                        >
                            <Icon name="download" />
                            Export to Excel
                        </EmployeeButton>
                    </div>

                    <EmployeeButton
                        size="lg"
                        onClick={() => setRegistering(true)}
                        className="w-full !border-red-600 !bg-red-600 !text-white hover:!border-red-700 hover:!bg-red-700 sm:w-auto"
                    >
                        <Icon name="add" />
                        New Referral
                    </EmployeeButton>
                </div>

                {(invalidRange || emptyRange) && (
                    <p
                        role="alert"
                        className="mt-3 text-base font-semibold text-red-600"
                    >
                        {invalidRange
                            ? "The “From” date must be on or before the “To” date."
                            : "No referrals were registered by your section in that range."}
                    </p>
                )}

                <div
                    className={`mt-6 grid gap-4 ${
                        tabs.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
                    }`}
                >
                    {tabs.map((tab) => (
                        <CountCard
                            key={tab.key || "all"}
                            tab={tab}
                            count={counts[tab.key || "all"] ?? 0}
                            current={(filters.status ?? "") === tab.key}
                            onSelect={() => showList(tab.key)}
                        />
                    ))}
                </div>

                <div className="mt-5">
                    <SearchInput
                        size="lg"
                        label={
                            usesForm2309 ? "Find a Taxpayer" : "Find a referral"
                        }
                        initialValue={filters.search}
                        placeholder={
                            usesForm2309
                                ? "Type a name or a reference number"
                                : "Type part of the description or a reference number"
                        }
                        only={["documents", "counts", "filters"]}
                    />
                </div>

                {rows.length > 0 ? (
                    <ul className="mt-5 divide-y divide-line rounded-xl border border-line">
                        {rows.map((document) => {
                            const complete = isComplete(document);
                            const waiting =
                                !complete && !document.details_completed_at;

                            const urgency = waiting
                                ? urgencyOf(document)
                                : null;

                            const deleted = Boolean(
                                document.deletion_approved_at,
                            );
                            const pendingDelete =
                                Boolean(document.deletion_requested_at) &&
                                !deleted;

                            return (
                                <li
                                    key={document.document_id}
                                    aria-disabled={deleted}
                                    className={`flex items-stretch transition ${complete ? "bg-ok-100" : ""} ${
                                        deleted
                                            ? "pointer-events-none select-none opacity-50 grayscale"
                                            : ""
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`w-1.5 shrink-0 ${
                                            complete
                                                ? "bg-ok-600"
                                                : (urgency?.spine ??
                                                  "bg-transparent")
                                        }`}
                                    />

                                    <button
                                        type="button"
                                        disabled={deleted}
                                        tabIndex={deleted ? -1 : undefined}
                                        onClick={() =>
                                            setOpened({
                                                id: document.document_id,
                                                slip: false,
                                            })
                                        }
                                        className="min-w-0 flex-1 px-4 py-4 text-left transition hover:bg-brand-50"
                                    >
                                        {usesForm2309 ? (
                                            <p className="truncate text-lg font-bold text-black">
                                                {document.taxpayer_name ??
                                                    "No taxpayer on record"}
                                            </p>
                                        ) : (
                                            <p className="line-clamp-2 text-lg font-bold text-black">
                                                {document.concern ||
                                                    "No description"}
                                            </p>
                                        )}

                                        <p className="mt-0.5 font-mono text-sm text-black">
                                            {document.tracking_number}
                                        </p>

                                        {!usesForm2309 &&
                                            document.destination_section && (
                                                <p className="mt-1 text-base font-semibold text-black">
                                                    To{" "}
                                                    {
                                                        document
                                                            .destination_section
                                                            .section_name
                                                    }
                                                </p>
                                            )}

                                        <p className="mt-1 text-base text-black">
                                            Registered{" "}
                                            {exactTime(document.created_at)}
                                        </p>

                                        <SlipPdfSize
                                            document={document}
                                            variant={
                                                usesForm2309
                                                    ? "2309"
                                                    : "section"
                                            }
                                        />
                                    </button>

                                    <div className="flex shrink-0 flex-col items-end justify-center gap-2 py-4 pr-4">
                                        {deleted ? (
                                            <span className="shrink-0 rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white">
                                                Deleted
                                            </span>
                                        ) : pendingDelete ? (
                                            <>
                                                <StatusPill
                                                    document={document}
                                                />

                                                <span className="shrink-0 rounded-full bg-accent-100 px-3 py-1 text-sm font-bold text-black">
                                                    Deletion pending approval
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <StatusPill
                                                    document={document}
                                                />

                                                {complete ? (
                                                    <EmployeeButton
                                                        variant="quiet"
                                                        onClick={() =>
                                                            setOpened({
                                                                id: document.document_id,
                                                                slip: false,
                                                            })
                                                        }
                                                    >
                                                        <Icon name="check" />
                                                        View trail
                                                    </EmployeeButton>
                                                ) : waiting ? (
                                                    <>
                                                        <AgeBadge
                                                            document={document}
                                                        />

                                                        {canCompleteDetails && (
                                                            <EmployeeButton
                                                                variant="secondary"
                                                                onClick={() =>
                                                                    setCompleting(
                                                                        document,
                                                                    )
                                                                }
                                                            >
                                                                <Icon name="register" />
                                                                Complete details
                                                            </EmployeeButton>
                                                        )}
                                                    </>
                                                ) : (
                                                    <EmployeeButton
                                                        variant="quiet"
                                                        onClick={() =>
                                                            setOpened({
                                                                id: document.document_id,
                                                                slip: true,
                                                            })
                                                        }
                                                    >
                                                        <Icon name="print" />
                                                        Reference slip
                                                    </EmployeeButton>
                                                )}

                                                {!complete && (
                                                    <div className="flex gap-2">
                                                        <EmployeeButton
                                                            variant="secondary"
                                                            onClick={() =>
                                                                setEditing(
                                                                    document,
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </EmployeeButton>

                                                        <EmployeeButton
                                                            variant="quiet"
                                                            onClick={() =>
                                                                setDeleting(
                                                                    document,
                                                                )
                                                            }
                                                            className="!text-red-600"
                                                        >
                                                            Delete
                                                        </EmployeeButton>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="mt-5 rounded-xl border border-dashed border-line py-14 text-center">
                        <p className="text-lg font-semibold text-black">
                            {filters.search
                                ? "No referrals match your search."
                                : filters.status === "waiting"
                                  ? "No referrals are waiting for details."
                                  : "No referrals have been registered yet."}
                        </p>

                        <p className="mt-1 text-base text-black">
                            {filters.search
                                ? usesForm2309
                                    ? "Try the taxpayer's name or the reference number."
                                    : "Try part of the description or the reference number."
                                : "Press “Register a referral” when a new document comes in."}
                        </p>
                    </div>
                )}

                {documents?.links?.length > 3 && (
                    <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-base text-black">
                            Showing{" "}
                            <span className="font-semibold text-black">
                                {documents.from ?? 0}–{documents.to ?? 0}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-black">
                                {documents.total ?? 0}
                            </span>
                        </p>

                        <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                            {documents.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url &&
                                        router.visit(link.url, {
                                            preserveState: true,
                                            preserveScroll: true,
                                        })
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`min-h-11 rounded-xl border px-4 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                        link.active
                                            ? "border-brand-600 bg-brand-600 text-white"
                                            : "border-line bg-white text-black hover:bg-sunken"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </EmployeeCard>

            {(registering || editing) && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/70 p-4 sm:p-8"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="w-full max-w-2xl">
                        {usesForm2309 ? (
                            <ReferralFormPanel
                                key={editing?.document_id ?? "new"}
                                sections={sections}
                                options={referralOptions}
                                fromSection={fromSection}
                                referral={editing}
                                onCancel={closeForm}
                                onRegistered={closeForm}
                            />
                        ) : (
                            <SectionReferralPanel
                                key={editing?.document_id ?? "new"}
                                sections={sections}
                                fromSection={fromSection}
                                referral={editing}
                                onCancel={closeForm}
                            />
                        )}
                    </div>
                </div>
            )}

            <DetailsFormModal
                open={Boolean(completing)}
                onClose={() => setCompleting(null)}
                onCompleted={(document) =>
                    setOpened({ id: document.document_id, slip: true })
                }
                document={completing}
                sections={sections}
                options={referralOptions}
            />

            {deleting && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4"
                    role="alertdialog"
                    aria-modal="true"
                >
                    <EmployeeCard>
                        <div className="max-w-md">
                            <h2 className="text-xl font-bold text-black">
                                Request deletion?
                            </h2>

                            <p className="mt-2 text-base text-black">
                                {deleting.concern || "This referral"} (
                                {deleting.tracking_number}) will be sent to the
                                super admin for approval. It stays in the
                                register until it is approved.
                            </p>

                            <label
                                htmlFor="deletion-reason"
                                className="mt-4 block text-base font-semibold text-black"
                            >
                                Reason for deletion{" "}
                                <span className="text-red-600">*</span>
                            </label>

                            <textarea
                                id="deletion-reason"
                                value={reason}
                                onChange={(e) => {
                                    setReason(e.target.value);
                                    setReasonError("");
                                }}
                                maxLength={500}
                                rows={4}
                                placeholder="Type why this referral needs to be deleted"
                                className={`mt-1 w-full rounded-xl border p-3 text-base text-black ${
                                    reasonError
                                        ? "border-red-600"
                                        : "border-line"
                                }`}
                            />

                            <div className="mt-1 flex items-start justify-between gap-3">
                                <p
                                    role="alert"
                                    className="text-base font-semibold text-red-600"
                                >
                                    {reasonError}
                                </p>

                                <p className="shrink-0 text-sm text-black">
                                    {reason.length}/500
                                </p>
                            </div>

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <EmployeeButton
                                    variant="quiet"
                                    onClick={closeDelete}
                                >
                                    Cancel
                                </EmployeeButton>

                                <EmployeeButton
                                    onClick={confirmDelete}
                                    disabled={reason.trim().length < 10}
                                    className="!border-red-600 !bg-red-600 !text-white hover:!border-red-700 hover:!bg-red-700"
                                >
                                    Yes, Send Request
                                </EmployeeButton>
                            </div>
                        </div>
                    </EmployeeCard>
                </div>
            )}
            {opened && (
                <DocumentTrailModal
                    documentId={opened.id}
                    openSlip={opened.slip}
                    slipVariant={usesForm2309 ? "2309" : "section"}
                    onClose={() => setOpened(null)}
                />
            )}

            {printing &&
                reportDocuments.length > 0 &&
                createPortal(
                    <div id="print-root" className="hidden print:block">
                        <TransmittalSheet
                            documents={reportDocuments}
                            fromSection={fromSection}
                            from={range.from}
                            until={range.until}
                            releasedBy={releasedBy}
                        />
                    </div>,
                    window.document.body,
                )}
        </EmployeeLayout>
    );
}
