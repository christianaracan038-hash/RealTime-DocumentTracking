import { useEffect } from "react";
import { createPortal } from "react-dom";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import { addressedTo, longDate, sentFrom } from "./referral";

/*
 * BIR Form 2309 - Reference Slip.
 *
 * Printed portrait, full sheet, stacked sections top to bottom - matching
 * the original 1971 form: Header / To / Subject / For / Remarks / From.
 * The only deliberate deviation from the original form is the QR code,
 * placed inside the "To" section next to the reference number.
 *
 * Printing: the slip is rendered a second time into a portal directly
 * under <body>, and the print stylesheet hides every other child of
 * <body>. Hiding with display:none (not visibility) is what stops the
 * rest of the page from spanning a dozen blank pages, since a hidden
 * element that still has height still gets paginated.
 *
 * On-screen preview: the slip's true size (4.3in x 8in) reads as quite
 * large at 100% browser zoom — it used to force people to zoom their
 * whole browser out to ~80% just to see it. Instead, only the preview
 * copy inside the modal is visually shrunk with CSS `zoom`, which
 * (unlike `transform: scale`) also shrinks the space it takes up, so
 * there's no leftover blank gap below it. The print copy is a
 * completely separate node (#print-root) and is never touched by this,
 * so it always prints at true size regardless of the preview's zoom.
 *
 * NOTE: page orientation (portrait) needs to be set wherever your global
 * print stylesheet lives, e.g.:
 *   @media print {
 *     @page { size: portrait; margin: 0.4in; }
 *   }
 * This file only controls the content, not the @page size.
 *
 * The seal is read from /images/bir-logo.png.
 */

function Section({ title, children, className = "" }) {
    return (
        <div
            className={`flex min-w-0 flex-col border-navy-900 px-3 py-2 ${className}`}
        >
            {title && (
                <p className="mb-1 text-[9px] font-bold tracking-wider text-navy-900 uppercase">
                    {title}
                </p>
            )}
            {children}
        </div>
    );
}

export function ReferenceSlip({ document }) {
    return (
        <div className="reference-slip flex h-[8in] w-[4.300in] flex-col border-2 border-navy-900 bg-white text-[9px] leading-snug text-navy-900">
            {/* 1. Header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-navy-900 px-3 py-2">
                <img
                    src="/images/bir-logo.png"
                    alt=""
                    className="h-9 w-9 shrink-0 object-contain"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <div className="min-w-0">
                    <p className="text-[7px] font-semibold">BIR</p>
                    <p className="text-[8px] font-bold">FORM 2309</p>
                    <p className="text-[6.5px]">(REVISED OCTOBER, 1971)</p>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-[7px] font-semibold tracking-wide">
                        BUREAU OF INTERNAL REVENUE
                    </p>
                    <p className="text-[10.5px] font-bold">REFERENCE SLIP</p>
                </div>
            </div>

            {/* 2. To (+ QR - the one intentional addition) */}
            <Section
                title="To"
                className="flex-row shrink-0 items-start gap-3 border-b"
            >
                <div className="min-w-0 flex-1">
                    <p className="text-[7.5px] uppercase">
                        Name and/or designation of recipient
                    </p>
                    <p className="mt-1 font-bold">{addressedTo(document)}</p>

                    <p className="mt-2 text-[7.5px] uppercase">Date</p>
                    <p className="font-semibold">
                        {longDate(document.document_date)}
                    </p>
                </div>

                <div className="flex shrink-0 flex-col items-center text-center">
                    <img
                        src={route("documents.qr", document.document_id)}
                        alt={`QR code for ${document.tracking_number}`}
                        className="h-[0.7in] w-[0.7in]"
                    />
                    <p className="mt-1 text-[7px] uppercase">Reference No.</p>
                    <p className="font-mono text-[9px] font-bold">
                        {document.tracking_number}
                    </p>
                </div>
            </Section>

            {/* 3. Subject */}
            <Section
                title="Subject"
                className="min-h-[0.9in] shrink-0 border-b"
            >
                <p className="font-bold">{document.taxpayer_name}</p>
                <p>{document.concern}</p>
            </Section>

            {/* 4. For */}
            <Section title="For" className="min-h-[0.6in] shrink-0 border-b">
                <p className="font-semibold">{document.referred_for}</p>
            </Section>

            {/* 5. Remarks */}
            <Section title="Remarks" className="h-[3.5in] border-b">
                <p className="whitespace-pre-wrap">{document.remarks || " "}</p>
            </Section>

            {/* 6. From + office code */}
            <div className="flex shrink-0 items-end gap-4 px-3 py-2">
                <div className="min-w-0 flex-1">
                    <p className="text-[7.5px] uppercase">From</p>
                    <p className="font-semibold">{sentFrom(document)}</p>
                </div>

                {/*
                 * Left blank on purpose: the office fills this in by
                 * hand. The stored value is not the one they use.
                 */}
                <div className="w-[1.8in] shrink-0">
                    <p className="text-[7.5px] uppercase">Office code</p>
                    <p
                        aria-label="Office code, to be written by hand"
                        className="h-4 border-b border-navy-900"
                    />
                </div>
            </div>
        </div>
    );
}

export default function ReferenceSlipModal({ document, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!document) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/70 p-4 print:hidden sm:items-center sm:p-8"
                role="dialog"
                aria-modal="true"
                aria-label="Reference slip"
            >
                <div className="w-full max-w-2xl rounded-2xl bg-white">
                    <div className="flex items-start justify-between gap-4 border-b border-line px-7 py-5">
                        <div>
                            <p className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                BIR Form 2309
                            </p>

                            <h2 className="mt-1 text-2xl font-bold text-navy-900">
                                Reference slip
                            </h2>

                            <p className="mt-1 text-base text-muted">
                                Print this and attach it to the document. It
                                prints portrait, full sheet.
                            </p>
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

                    {/*
                     * `zoom` (not `transform: scale`) shrinks both the
                     * visual size AND the space reserved for it, so the
                     * modal doesn't end up with an empty gap below a
                     * scaled-down slip. Only this preview copy is
                     * affected — the print copy below is a separate,
                     * untouched node.
                     */}
                    <div className="flex justify-center overflow-x-auto px-7 py-6">
                        <div style={{ zoom: 0.6 }}>
                            <ReferenceSlip document={document} />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-line px-7 py-5 sm:flex-row sm:justify-end">
                        <EmployeeButton variant="quiet" onClick={onClose}>
                            Close
                        </EmployeeButton>

                        <EmployeeButton onClick={() => window.print()}>
                            <Icon name="print" />
                            Print slip
                        </EmployeeButton>
                    </div>
                </div>
            </div>

            {/*
             * The copy that actually prints. It lives directly under <body>
             * so the print stylesheet can hide everything else with
             * display:none and leave only this. Invisible on screen.
             * Always renders at true size — the preview's zoom above
             * never reaches this node.
             */}
            {createPortal(
                <>
                    <style>{`
                        @media print {
                            @page {
                                size: 4.375in 9in;
                                margin: 0;
                            }
                        }
                    `}</style>
                    <div id="print-root" className="hidden print:block">
                        <ReferenceSlip document={document} />
                    </div>
                </>,
                window.document.body,
            )}
        </>
    );
}
