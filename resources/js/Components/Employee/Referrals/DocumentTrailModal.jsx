import { useEffect, useState } from "react";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import EmployeeBadge from "@/Components/Employee/EmployeeBadge";
import Icon from "@/Components/Employee/Icon";
import ReferenceSlipModal from "./ReferenceSlipModal";
import SectionSlipModal from "./SectionSlipModal";
import { addressedTo, exactTime, longDate, sentFrom } from "./referral";

const ACTION_TONE = {
    REGISTERED: "bg-accent-400",
    RECEIVED: "bg-ok-100",
    FORWARDED: "bg-brand-100",
    COMPLETED: "bg-navy-200",
};

const buildTimeline = (document) => {
    const trail = document.tracking_histories ?? [];
    const creator = document.creator;

    let section = creator?.section?.section_name ?? null;
    let holder = creator?.username ?? null;

    const steps = [
        {
            key: "registered",
            action: "REGISTERED",
            time: document.created_at,
            from: null,
            to: section,
            by: creator?.username,
            remarks: null,
            section,
            holder,
        },
    ];

    trail.forEach((move) => {
        const action = (move.action ?? "").toUpperCase();
        const toSection = move.to_section?.section_name;
        const fromSection = move.from_section?.section_name;
        const actor = move.employee?.username ?? null;

        if (action === "FORWARDED") {
            section = toSection ?? section;
            holder = null;
        } else if (action === "RECEIVED") {
            section = toSection ?? fromSection ?? section;
            holder = actor;
        } else {
            section = toSection ?? fromSection ?? section;
            holder = actor ?? holder;
        }

        steps.push({
            key: move.tracking_history_id,
            action,
            time: move.tracked_at,
            from: fromSection,
            to: toSection,
            by: actor,
            remarks: move.remarks,
            section,
            holder,
        });
    });

    return steps;
};

function Row({ label, children }) {
    if (!children) return null;

    return (
        <div className="contents">
            <dt className="text-sm font-semibold text-black">{label}</dt>
            <dd className="text-base text-black">{children}</dd>
        </div>
    );
}

function StepDetail({ label, value, sub, fallback }) {
    return (
        <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-black">
                {label}
            </dt>
            <dd
                className={`truncate text-base text-black ${
                    value ? "font-semibold" : "italic"
                }`}
            >
                {value || fallback}
            </dd>
            {value && sub && (
                <dd className="truncate text-sm text-black">{sub}</dd>
            )}
        </div>
    );
}

export default function DocumentTrailModal({
    documentId,
    onClose,
    openSlip = false,
    slipVariant = "2309",
}) {
    const [document, setDocument] = useState(null);
    const [error, setError] = useState(null);
    const [slipOpen, setSlipOpen] = useState(false);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    useEffect(() => {
        let cancelled = false;

        setDocument(null);
        setError(null);

        fetch(route("documents.detail", documentId), {
            credentials: "same-origin",
            headers: { Accept: "application/json" },
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(
                        response.status === 404
                            ? "This document is not available to you."
                            : "This document could not be loaded.",
                    );
                }

                return response.json();
            })
            .then((body) => {
                if (cancelled) return;

                setDocument(body.document);

                if (openSlip) setSlipOpen(true);
            })
            .catch((err) => !cancelled && setError(err.message));

        return () => {
            cancelled = true;
        };
    }, [documentId]);

    const timeline = document ? buildTimeline(document) : [];
    const creatorName = document?.creator?.username;
    const creatorSection = document?.creator?.section?.section_name;

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/70 p-4 sm:items-center sm:p-8"
                role="dialog"
                aria-modal="true"
                aria-label="Document details"
            >
                <div className="w-full max-w-2xl rounded-2xl bg-surface">
                    <div className="flex items-start justify-between gap-4 border-b border-line px-7 py-5">
                        <div className="min-w-0">
                            <h2 className="text-2xl font-bold text-black">
                                {document
                                    ? (document.taxpayer_name ??
                                      document.concern ??
                                      "No taxpayer on record")
                                    : "Loading..."}
                            </h2>

                            {document && (
                                <p className="mt-1 font-mono text-sm text-black">
                                    {document.tracking_number}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl leading-none text-black transition hover:bg-sunken"
                        >
                            <Icon name="close" />
                        </button>
                    </div>

                    {error && (
                        <p className="px-7 py-10 text-center text-base font-medium text-stop-600">
                            {error}
                        </p>
                    )}

                    {!document && !error && (
                        <p className="px-7 py-10 text-center text-base text-black">
                            Loading document...
                        </p>
                    )}

                    {document && (
                        <>
                            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 px-7 py-6">
                                <Row label="Date issued">
                                    {longDate(document.document_date)}
                                </Row>
                                <Row label="Concern">{document.concern}</Row>
                                {document.referred_for && (
                                    <Row label="For">
                                        {document.referred_for}
                                    </Row>
                                )}
                                <Row label="Remarks">{document.remarks}</Row>
                                <Row label="From">{sentFrom(document)}</Row>
                                <Row label="To">{addressedTo(document)}</Row>
                                <Row label="Registered">
                                    {exactTime(document.created_at)}
                                </Row>
                                <Row label="Received">
                                    {document.received_at &&
                                        exactTime(document.received_at)}
                                </Row>
                                <Row label="Completed">
                                    {document.completed_at &&
                                        exactTime(document.completed_at)}
                                </Row>

                                <div className="contents">
                                    <dt className="text-sm font-semibold text-black">
                                        Status
                                    </dt>
                                    <dd>
                                        <EmployeeBadge
                                            status={
                                                document.status?.status_name
                                            }
                                        />
                                        {document.awaiting_details && (
                                            <span className="ml-2 rounded-full bg-accent-400 px-2.5 py-0.5 text-xs font-bold text-black">
                                                Awaiting details
                                            </span>
                                        )}
                                    </dd>
                                </div>
                            </dl>

                            <div className="border-t border-line px-7 py-6">
                                <h3 className="text-base font-bold text-black">
                                    Movement history
                                </h3>

                                <ol className="mt-4 space-y-3">
                                    {timeline.map((step, index) => {
                                        const isLatest =
                                            index === timeline.length - 1;

                                        return (
                                            <li
                                                key={step.key}
                                                className={`rounded-xl border p-4 ${
                                                    isLatest
                                                        ? "border-brand-600 bg-brand-50"
                                                        : "border-line"
                                                }`}
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-bold text-black ${
                                                                ACTION_TONE[
                                                                    step.action
                                                                ] ?? "bg-sunken"
                                                            }`}
                                                        >
                                                            {step.action}
                                                        </span>

                                                        {isLatest && (
                                                            <span className="rounded-full border border-brand-600 px-2.5 py-1 text-xs font-bold text-black">
                                                                Latest
                                                            </span>
                                                        )}
                                                    </div>

                                                    <span className="text-sm text-black">
                                                        {exactTime(step.time)}
                                                    </span>
                                                </div>

                                                {(step.from || step.to) && (
                                                    <p className="mt-2 text-base font-semibold text-black">
                                                        {step.from ? (
                                                            <>
                                                                {step.from}{" "}
                                                                <Icon
                                                                    name="forward"
                                                                    className="mx-1 text-black"
                                                                />{" "}
                                                                {step.to ?? "—"}
                                                            </>
                                                        ) : (
                                                            <>
                                                                Registered in{" "}
                                                                {step.to}
                                                            </>
                                                        )}
                                                    </p>
                                                )}

                                                <dl className="mt-3 grid grid-cols-1 gap-3 rounded-lg bg-white px-3 py-3 sm:grid-cols-3">
                                                    <StepDetail
                                                        label="Created by"
                                                        value={creatorName}
                                                        sub={creatorSection}
                                                        fallback="Unknown"
                                                    />

                                                    <StepDetail
                                                        label="Current section"
                                                        value={step.section}
                                                        fallback="No section assigned"
                                                    />

                                                    <StepDetail
                                                        label="Current holder"
                                                        value={step.holder}
                                                        fallback="Not yet received"
                                                    />
                                                </dl>

                                                {(step.by || step.remarks) && (
                                                    <p className="mt-2 text-sm text-black">
                                                        {step.by &&
                                                            `Action by ${step.by}`}
                                                        {step.by &&
                                                            step.remarks &&
                                                            " · "}
                                                        {step.remarks}
                                                    </p>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-line px-7 py-5 sm:flex-row sm:justify-end">
                                <EmployeeButton
                                    variant="quiet"
                                    onClick={onClose}
                                >
                                    Close
                                </EmployeeButton>

                                {!document.awaiting_details && (
                                    <EmployeeButton
                                        onClick={() => setSlipOpen(true)}
                                    >
                                        <Icon name="print" />
                                        View slip
                                    </EmployeeButton>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {slipOpen && document && slipVariant === "section" && (
                <SectionSlipModal
                    document={document}
                    onClose={() => setSlipOpen(false)}
                />
            )}

            {slipOpen && document && slipVariant !== "section" && (
                <ReferenceSlipModal
                    document={document}
                    onClose={() => setSlipOpen(false)}
                />
            )}
        </>
    );
}
