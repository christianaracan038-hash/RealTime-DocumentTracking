import { useEffect } from "react";
import { createPortal } from "react-dom";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import { exactTime, sectionLabel } from "./referral";

/*
 * The accountability slip - every section except the RDO.
 *
 * Not BIR Form 2309. That form is a taxpayer's referral and carries the
 * taxpayer's business; this is an internal docket moving between
 * sections, and what the office needs from the paper is two signatures:
 * one from whoever handed it over, one from whoever took it.
 *
 * Half a sheet, crosswise - 8.5in by 5.5in - laid out as three columns
 * and two rows, as the office drew it:
 *
 *     Details          | Signature (Inbound)  | Signature (Outbound)
 *     QR + date stamp  | Prepared: <section>  | Received: <section>
 *
 * The signature cells are deliberately empty and deliberately tall. The
 * whole point of this slip is the two names written into them by hand.
 */

function SignatureCell({ direction }) {
    return (
        <div className="flex flex-col border-l-2 border-navy-900 px-4 py-3">
            <p className="text-center text-[15px] font-bold">Signature</p>

            <p className="text-center text-[12px]">({direction})</p>

            {/* Left empty on purpose - somebody signs here */}
            <div className="flex-1" />
        </div>
    );
}

export function SectionSlip({ document }) {
    return (
        <div className="section-slip flex h-[5.5in] w-[8.5in] flex-col border-2 border-navy-900 bg-white text-navy-900">
            {/* Row 1 */}
            <div className="grid flex-1 grid-cols-[1.25fr_1fr_1fr]">
                <div className="flex flex-col px-4 py-3">
                    <p className="text-[15px] font-bold">Details</p>

                    <p className="mt-2 flex-1 text-[13px] leading-relaxed whitespace-pre-wrap">
                        {document.concern || " "}
                    </p>
                </div>

                <SignatureCell direction="Inbound" />
                <SignatureCell direction="Outbound" />
            </div>

            {/* Row 2 */}
            <div className="grid h-[2.1in] shrink-0 grid-cols-[1.25fr_1fr_1fr] border-t-2 border-navy-900">
                <div className="flex items-center gap-3 px-4 py-3">
                    <img
                        src={route("documents.qr", document.document_id)}
                        alt={`QR code for ${document.tracking_number}`}
                        className="h-[1.3in] w-[1.3in] shrink-0"
                    />

                    <div className="min-w-0 flex-1 text-right">
                        <p className="font-mono text-[11px] font-bold">
                            {document.tracking_number}
                        </p>

                        <p className="mt-1 text-[12px] italic">
                            {exactTime(document.created_at)}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col justify-center border-l-2 border-navy-900 px-4 py-3">
                    <p className="text-[14px] font-bold">Prepared:</p>

                    <p className="text-[13px]">
                        {sectionLabel(document.creator?.section) || "—"}
                    </p>
                </div>

                <div className="flex flex-col justify-center border-l-2 border-navy-900 px-4 py-3">
                    <p className="text-[14px] font-bold">Received:</p>

                    <p className="text-[13px]">
                        {sectionLabel(document.destination_section) || "—"}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function SectionSlipModal({ document, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();

        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!document) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/70 p-4 sm:p-8">
                <div className="w-full max-w-4xl rounded-2xl bg-surface">
                    <div className="flex items-start justify-between gap-4 border-b border-line px-7 py-5">
                        <div>
                            <h2 className="text-2xl font-bold text-navy-900">
                                Referral slip
                            </h2>

                            <p className="mt-1 text-base text-muted">
                                Half a sheet, crosswise. Both signature blocks
                                are signed by hand.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl leading-none text-muted transition hover:bg-sunken hover:text-navy-900"
                        >
                            <Icon name="close" />
                        </button>
                    </div>

                    {/*
                     * Shrunk for the preview only. `zoom` also shrinks the
                     * space it takes up, which `transform: scale` does not,
                     * so there is no blank gap underneath. The print copy
                     * is a separate node and is never touched by this.
                     */}
                    <div className="overflow-x-auto px-7 py-6">
                        <div style={{ zoom: 0.72 }}>
                            <SectionSlip document={document} />
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

            {createPortal(
                <div id="print-root" className="hidden print:block">
                    <SectionSlip document={document} />
                </div>,
                window.document.body,
            )}
        </>
    );
}
