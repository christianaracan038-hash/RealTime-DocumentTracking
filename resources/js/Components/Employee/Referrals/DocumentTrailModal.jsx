import { useEffect, useState } from "react";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import EmployeeBadge from "@/Components/Employee/EmployeeBadge";
import Icon from "@/Components/Employee/Icon";
import ReferenceSlipModal from "./ReferenceSlipModal";
import { addressedTo, exactTime, longDate, sentFrom } from "./referral";

/*
 * Everything about one document, fetched when it is opened.
 *
 * History lists only a taxpayer and a date. The rest - the referral's
 * details and its whole movement trail - is loaded from
 * documents.detail on demand, so a page of history stays small however
 * many times a document has moved and however long the archive grows.
 */

function Row({ label, children }) {
    if (!children) return null;

    return (
        <div className="contents">
            <dt className="text-sm font-semibold text-muted">{label}</dt>
            <dd className="text-base text-navy-900">{children}</dd>
        </div>
    );
}

const ACTION_TONE = {
    RECEIVED: "bg-ok-100 text-ok-600",
    FORWARDED: "bg-brand-100 text-brand-700",
    COMPLETED: "bg-navy-200 text-navy-900",
};

export default function DocumentTrailModal({
    documentId,
    onClose,

    /*
     * Go straight to the reference slip once the document has loaded.
     * The register offers "Reference slip" on a row, and the row is too
     * light to build a slip from - it has to be fetched first, so the
     * fetch happens here and the slip opens on top of it.
     */
    openSlip = false,
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
                            ? "That document is not available to you."
                            : "Could not load this document.",
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

    const trail = document?.tracking_histories ?? [];

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/70 p-4 sm:items-center sm:p-8"
                role="dialog"
                aria-modal="true"
                aria-label="Document detail"
            >
                <div className="w-full max-w-2xl rounded-2xl bg-white">
                    <div className="flex items-start justify-between gap-4 border-b border-line px-7 py-5">
                        <div className="min-w-0">
                            <h2 className="text-2xl font-bold text-navy-900">
                                {document?.taxpayer_name ?? "Loading..."}
                            </h2>

                            {document && (
                                <p className="mt-1 font-mono text-sm text-muted">
                                    {document.tracking_number}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl leading-none text-muted transition hover:bg-paper hover:text-navy-900"
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
                        <p className="px-7 py-10 text-center text-base text-muted">
                            Loading the document...
                        </p>
                    )}

                    {document && (
                        <>
                            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 px-7 py-6">
                                <Row label="Date issued">
                                    {longDate(document.document_date)}
                                </Row>
                                <Row label="Concerns">{document.concern}</Row>

                                {/*
                                 * Only for referrals recorded before
                                 * "For" became a hand-ticked block on the
                                 * printed slip. Nothing stores it now.
                                 */}
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
                                    <dt className="text-sm font-semibold text-muted">
                                        Status
                                    </dt>
                                    <dd>
                                        <EmployeeBadge
                                            status={
                                                document.status?.status_name
                                            }
                                        />
                                        {document.awaiting_details && (
                                            <span className="ml-2 rounded-full bg-accent-400 px-2.5 py-0.5 text-xs font-bold text-navy-900">
                                                Awaiting details
                                            </span>
                                        )}
                                    </dd>
                                </div>
                            </dl>

                            {/* Where it has been */}
                            <div className="border-t border-line px-7 py-6">
                                <h3 className="text-base font-bold text-navy-900">
                                    Movement history
                                </h3>

                                {trail.length > 0 ? (
                                    <ol className="mt-4 space-y-3">
                                        {trail.map((move) => (
                                            <li
                                                key={move.tracking_history_id}
                                                className="rounded-xl border border-line p-4"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                                            ACTION_TONE[
                                                                move.action
                                                            ] ??
                                                            "bg-paper text-navy-800"
                                                        }`}
                                                    >
                                                        {move.action}
                                                    </span>

                                                    <span className="text-sm text-muted">
                                                        {exactTime(
                                                            move.tracked_at,
                                                        )}
                                                    </span>
                                                </div>

                                                <p className="mt-2 text-base text-navy-900">
                                                    {move.from_section
                                                        ?.section_name ??
                                                        "—"}{" "}
                                                    <Icon
                                                        name="forward"
                                                        className="mx-1 text-muted"
                                                    />{" "}
                                                    {move.to_section
                                                        ?.section_name ?? "—"}
                                                </p>

                                                <p className="mt-1 text-sm text-muted">
                                                    By{" "}
                                                    {move.employee?.username ??
                                                        "—"}
                                                    {move.remarks
                                                        ? ` · ${move.remarks}`
                                                        : ""}
                                                </p>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="mt-3 text-base text-muted">
                                        It has not moved yet.
                                    </p>
                                )}
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

            {slipOpen && document && (
                <ReferenceSlipModal
                    document={document}
                    onClose={() => setSlipOpen(false)}
                />
            )}
        </>
    );
}
