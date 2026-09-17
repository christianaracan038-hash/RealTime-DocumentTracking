import { useEffect } from "react";
import { createPortal } from "react-dom";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import { addressedTo, longDate, sentFrom } from "./referral";

/*
 * BIR Form 2309 - Reference Slip.
 *
 * Printed on a quarter sheet, lengthwise: a 5.5in x 4.25in landscape
 * card, stapled to the physical document as its tracker. Six sections in
 * a 3 x 2 grid, read left to right, top to bottom - six columns in a row
 * do not fit on a card that size.
 *
 * Printing: the slip is rendered a second time into a portal directly
 * under <body>, and the print stylesheet hides every other child of
 * <body>. Hiding with display:none (not visibility) is what stops the
 * rest of the page from spanning a dozen blank pages, since a hidden
 * element that still has height still gets paginated.
 *
 * The seal is read from /images/bir-logo.png.
 */

function Cell({ title, children, className = "" }) {
    return (
        <div
            className={`flex min-w-0 flex-col border-navy-900 px-2 py-1.5 ${className}`}
        >
            {title && (
                <p className="mb-1 text-[8px] font-bold tracking-wider text-navy-900 uppercase">
                    {title}
                </p>
            )}
            {children}
        </div>
    );
}

export function ReferenceSlip({ document }) {
    return (
        <div className="reference-slip w-[5.1in] border-2 border-navy-900 bg-white text-navy-900">
            <div className="grid grid-cols-3 grid-rows-[1.8in_1.8in] text-[9.5px] leading-snug">
                {/* 1. Header */}
                <Cell className="items-center justify-center border-r border-b text-center">
                    <img
                        src="/images/bir-logo.png"
                        alt=""
                        className="mb-1 h-10 w-10 object-contain"
                        onError={(e) =>
                            (e.currentTarget.style.display = "none")
                        }
                    />
                    <p className="text-[7px] font-semibold tracking-wide">
                        REPUBLIC OF THE PHILIPPINES
                    </p>
                    <p className="text-[8.5px] font-bold">
                        BUREAU OF INTERNAL REVENUE
                    </p>
                    <p className="mt-1 text-[10px] font-bold">REFERENCE SLIP</p>
                    <p className="text-[7.5px]">BIR FORM 2309</p>
                    <p className="text-[7px]">(REVISED OCTOBER, 1971)</p>
                </Cell>

                {/* 2. QR + reference number */}
                <Cell className="items-center justify-center border-r border-b text-center">
                    <img
                        src={route("documents.qr", document.document_id)}
                        alt={`QR code for ${document.tracking_number}`}
                        className="h-[1.05in] w-[1.05in]"
                    />
                    <p className="mt-1 text-[7px] uppercase">Reference No.</p>
                    <p className="font-mono text-[9px] font-bold">
                        {document.tracking_number}
                    </p>
                </Cell>

                {/* 3. To + date */}
                <Cell title="To" className="border-b">
                    <p className="text-[7px] uppercase">Date</p>
                    <p className="font-semibold">
                        {longDate(document.document_date)}
                    </p>

                    <p className="mt-auto pt-2 font-bold">
                        {addressedTo(document)}
                    </p>
                </Cell>

                {/* 4. Subject + for */}
                <Cell title="Subject" className="border-r">
                    <p className="font-bold">{document.taxpayer_name}</p>
                    <p>{document.concern}</p>

                    <p className="mt-auto pt-2 text-[7px] uppercase">For</p>
                    <p className="font-semibold">{document.referred_for}</p>
                </Cell>

                {/* 5. Remarks */}
                <Cell title="Remarks" className="border-r">
                    <p className="whitespace-pre-wrap">
                        {document.remarks || " "}
                    </p>
                </Cell>

                {/* 6. From + office code */}
                <Cell title="From">
                    <p className="font-semibold">{sentFrom(document)}</p>

                    {/*
                     * Left blank on purpose: the office fills this in by
                     * hand. The stored value is not the one they use.
                     */}
                    <p className="mt-auto pt-2 text-[7px] uppercase">
                        Office code
                    </p>
                    <p
                        aria-label="Office code, to be written by hand"
                        className="h-4 border-b border-navy-900"
                    />
                </Cell>
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
        <>
            <div
                className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/70 p-4 sm:items-center sm:p-8"
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
                                prints on a quarter sheet, lengthwise.
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
                        <ReferenceSlip document={document} />
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
             */}
            {createPortal(
                <div id="print-root" className="hidden print:block">
                    <ReferenceSlip document={document} />
                </div>,
                window.document.body,
            )}
        </>
    );
}
