import { useEffect } from "react";
import { createPortal } from "react-dom";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import { addressedTo, exactTime, sentFrom } from "./referral";

/*
 * The arrival stub - what step 1 prints.
 *
 * Without this, nothing physical carries the QR between the two steps,
 * so the document could not be scanned until the evening and the split
 * would achieve nothing. It is a small slip: the QR, the reference
 * number, who the document belongs to, where it is going, and the time
 * the clock started. Attached to the document straight away; the full
 * Form 2309 replaces it once the details are in.
 *
 * Printing works the same way as the reference slip: the stub is
 * rendered a second time under <body> and everything else is hidden
 * with display:none, so only one small sheet comes out.
 */

export function ArrivalStub({ document }) {
    return (
        <div className="arrival-stub w-[4in] border-2 border-navy-900 bg-white p-3 text-navy-900">
            <div className="flex items-start gap-3">
                <img
                    src={route("documents.qr", document.document_id)}
                    alt={`QR code for ${document.tracking_number}`}
                    className="h-[1.1in] w-[1.1in] shrink-0"
                />

                <div className="min-w-0 flex-1">
                    <p className="text-[8px] font-bold tracking-wider uppercase">
                        Bureau of Internal Revenue
                    </p>
                    <p className="text-[10px] font-bold">ARRIVAL STUB</p>

                    <p className="mt-1.5 text-[8px] uppercase">Reference No.</p>
                    <p className="font-mono text-[11px] font-bold">
                        {document.tracking_number}
                    </p>
                </div>
            </div>

            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-navy-900 pt-2 text-[10px]">
                <dt className="text-[8px] uppercase">Taxpayer</dt>
                <dd className="font-bold">{document.taxpayer_name ?? "—"}</dd>

                <dt className="text-[8px] uppercase">To</dt>
                <dd className="font-semibold">
                    {addressedTo(document) || "—"}
                </dd>

                <dt className="text-[8px] uppercase">From</dt>
                <dd>{sentFrom(document) || "—"}</dd>

                <dt className="text-[8px] uppercase">Registered</dt>
                <dd className="font-semibold">
                    {exactTime(document.created_at)}
                </dd>
            </dl>

            <p className="mt-2 border-t border-navy-900 pt-1.5 text-[8px] italic">
                Details to follow on BIR Form 2309.
            </p>
        </div>
    );
}

export default function ArrivalStubModal({ document, onClose }) {
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
                aria-label="Arrival stub"
            >
                <div className="w-full max-w-lg rounded-2xl bg-white">
                    <div className="flex items-start justify-between gap-4 border-b border-line px-7 py-5">
                        <div>
                            <p className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                Step 1 done
                            </p>

                            <h2 className="mt-1 text-2xl font-bold text-navy-900">
                                Arrival stub
                            </h2>

                            <p className="mt-1 text-base text-muted">
                                Print this and attach it to the document now, so
                                it can be scanned before the details are filled
                                in.
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

                    <div className="flex justify-center overflow-x-auto px-7 py-6">
                        <ArrivalStub document={document} />
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-line px-7 py-5 sm:flex-row sm:justify-end">
                        <EmployeeButton variant="quiet" onClick={onClose}>
                            Close
                        </EmployeeButton>

                        <EmployeeButton onClick={() => window.print()}>
                            <Icon name="print" />
                            Print stub
                        </EmployeeButton>
                    </div>
                </div>
            </div>

            {createPortal(
                <div id="print-root" className="hidden print:block">
                    <ArrivalStub document={document} />
                </div>,
                window.document.body,
            )}
        </>
    );
}
