import { useEffect } from "react";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import { addressedTo, longDate, sentFrom } from "./referral";

/*
 * BIR Form 2309 - Reference Slip.
 *
 * Six columns across one strip, printed a quarter of a sheet lengthwise
 * (8.5in x 2.75in) and stapled to the physical document as its tracker.
 *
 * Screen shows the slip inside a dialog with a Print button; the print
 * stylesheet in app.css hides everything but `.reference-slip` and sets
 * the page to the strip size.
 *
 * The seal is read from /images/bir-logo.png. Drop the official file
 * there; until then the column carries the bureau name only.
 */

function Column({ title, children, className = "" }) {
    return (
        <div
            className={`flex min-w-0 flex-col border-r border-navy-900 px-2 py-1.5 last:border-r-0 ${className}`}
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
        <div className="reference-slip w-full border-2 border-navy-900 bg-white text-navy-900">
            <div className="grid grid-cols-[1.35fr_0.95fr_1.25fr_1.5fr_1.35fr_1fr] text-[10.5px] leading-snug">
                {/* 1. Header */}
                <Column className="items-center justify-center text-center">
                    <img
                        src="/images/bir-logo.png"
                        alt=""
                        className="mb-1 h-9 w-9 object-contain"
                        onError={(e) =>
                            (e.currentTarget.style.display = "none")
                        }
                    />
                    <p className="text-[8px] font-semibold tracking-wide">
                        REPUBLIC OF THE PHILIPPINES
                    </p>
                    <p className="text-[9.5px] font-bold">
                        BUREAU OF INTERNAL REVENUE
                    </p>
                    <p className="mt-1 text-[11px] font-bold">REFERENCE SLIP</p>
                    <p className="text-[8px]">BIR FORM 2309</p>
                    <p className="text-[7.5px]">(REVISED OCTOBER, 1971)</p>
                </Column>

                {/* 2. QR + reference number */}
                <Column className="items-center justify-center text-center">
                    <img
                        src={route("documents.qr", document.document_id)}
                        alt={`QR code for ${document.tracking_number}`}
                        className="h-16 w-16"
                    />
                    <p className="mt-1 text-[8px] uppercase">Reference No.</p>
                    <p className="font-mono text-[10px] font-bold">
                        {document.tracking_number}
                    </p>
                </Column>

                {/* 3. To + date */}
                <Column title="To">
                    <p className="text-[8px] uppercase">Date</p>
                    <p className="font-semibold">
                        {longDate(document.document_date)}
                    </p>

                    <p className="mt-auto pt-2 font-bold">
                        {addressedTo(document)}
                    </p>
                </Column>

                {/* 4. Subject + for */}
                <Column title="Subject">
                    <p className="font-bold">{document.taxpayer_name}</p>
                    <p>{document.concern}</p>

                    <p className="mt-auto pt-2 text-[8px] uppercase">For</p>
                    <p className="font-semibold">{document.referred_for}</p>
                </Column>

                {/* 5. Remarks */}
                <Column title="Remarks">
                    <p className="whitespace-pre-wrap">
                        {document.remarks || " "}
                    </p>
                </Column>

                {/* 6. From + office code */}
                <Column title="From">
                    <p className="font-semibold">{sentFrom(document)}</p>

                    {/*
                     * Left blank on purpose: the office fills this in by
                     * hand. The stored value is not the one they use.
                     */}
                    <p className="mt-auto pt-2 text-[8px] uppercase">
                        Office code
                    </p>
                    <p
                        aria-label="Office code, to be written by hand"
                        className="h-4 border-b border-navy-900"
                    />
                </Column>
            </div>
        </div>
    );
}

export default function ReferenceSlipModal({ document, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, []);

    if (!document) return null;

    return (
        <div
            className="print-host fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/70 p-4 sm:items-center sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label="Reference slip"
        >
            <div className="w-full max-w-5xl rounded-2xl bg-white">
                <div className="print-hide flex items-start justify-between gap-4 border-b border-line px-7 py-5">
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                            BIR Form 2309
                        </p>

                        <h2 className="mt-1 text-2xl font-bold text-navy-900">
                            Reference slip
                        </h2>

                        <p className="mt-1 text-base text-muted">
                            Print this and attach it to the document. It prints
                            on a quarter sheet, lengthwise.
                            <span className="block sm:hidden">
                                Swipe sideways to see the whole slip.
                            </span>
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

                <div className="overflow-x-auto px-7 py-6">
                    <div className="min-w-[820px]">
                        <ReferenceSlip document={document} />
                    </div>
                </div>

                <div className="print-hide flex flex-col-reverse gap-3 border-t border-line px-7 py-5 sm:flex-row sm:justify-end">
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
    );
}
