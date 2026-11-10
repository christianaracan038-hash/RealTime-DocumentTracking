import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import { addressedTo, longDate, sentFrom } from "./referral";

const REFERRED_FOR = [
    "APPROVAL",
    "COMMENT",
    "INVESTIGATION",
    "INITIAL",
    "SIGNATURE",
    "AS REQUESTED",
    "DISSEMINATIONS",
    "NECESSARY ACTION",
    "SEE ME",
    "STUDY AND REPORT",
    "YOUR INFORMATION",
    "VERIFICATION",
    "FILE",
    "STUDY / RECOMMENDATION",
];

const SLIP_WIDTH_IN = 4.3;
const SLIP_HEIGHT_IN = 8;

function ForBoxes({ document }) {
    const options = REFERRED_FOR;

    const half = Math.ceil(options.length / 2);

    const columns = [options.slice(0, half), options.slice(half)];

    const recorded = String(document.referred_for ?? "")
        .split(",")
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean);

    const ticked = (option) => recorded.includes(option.toUpperCase());

    return (
        <div>
            <div className="flex gap-3">
                {columns.map((column, index) => (
                    <ul key={index} className="min-w-0 flex-1 space-y-[4px]">
                        {column.map((option) => (
                            <li
                                key={option}
                                className="flex items-center gap-1.5"
                            >
                                <span
                                    aria-hidden="true"
                                    className="flex h-[13px] w-[13px] shrink-0 items-center justify-center border border-navy-900 text-[10px] leading-none font-bold"
                                >
                                    {ticked(option) ? "X" : ""}
                                </span>

                                <span className="truncate text-[8.5px] uppercase">
                                    {option}
                                </span>
                            </li>
                        ))}
                    </ul>
                ))}
            </div>

            <div className="mt-1 flex items-end gap-1.5">
                <span className="shrink-0 text-[8.5px] uppercase">Other</span>

                <span
                    aria-hidden="true"
                    className="h-[13px] flex-1 border-b border-navy-900"
                />
            </div>

            <span
                aria-hidden="true"
                className="mt-[4px] block h-[13px] border-b border-navy-900"
            />
        </div>
    );
}

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

export function ReferenceSlip({ document, landscape = false }) {
    return (
        <div
            className={`reference-slip flex flex-col border-2 border-navy-900 bg-white text-[9px] leading-snug text-navy-900 ${
                landscape ? "h-[7.1in] w-[4.300in]" : "h-[8in] w-[4.300in]"
            }`}
        >
            <div className="flex shrink-0 items-center gap-3 border-b border-navy-900 px-3 py-2">
                <img
                    src="/images/bir_old_logo_for_header.png"
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

            <Section
                title="Subject"
                className="min-h-[0.9in] shrink-0 border-b"
            >
                <p>{document.concern}</p>
            </Section>

            <Section title="For" className="shrink-0 border-b">
                <ForBoxes document={document} />
            </Section>

            <div
                className={`flex min-w-0 flex-col border-b border-navy-900 px-3 py-2 ${
                    landscape ? "min-h-0 flex-1" : "h-[2.2in]"
                }`}
            >
                <p className="mb-1 text-[9px] font-bold tracking-wider text-navy-900 uppercase">
                    Remarks{" "}
                    <span className="font-normal normal-case">
                        (or additional instruction)
                    </span>
                </p>

                <p className="whitespace-pre-wrap">{document.remarks || " "}</p>
            </div>

            <div className="flex shrink-0 items-end gap-4 px-3 py-2">
                <div className="min-w-0 flex-1">
                    <p className="text-[7.5px] uppercase">From</p>
                    <p className="font-semibold">{sentFrom(document)}</p>
                </div>

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
    const exportRef = useRef(null);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState("");
    const [printMode, setPrintMode] = useState("sheet");

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!document) return null;

    const printSlip = (mode) => {
        flushSync(() => setPrintMode(mode));
        window.print();
    };

    const exportPdf = async () => {
        const node = exportRef.current;

        if (!node || exporting) return;

        setExporting(true);
        setExportError("");

        try {
            const images = Array.from(node.querySelectorAll("img"));

            await Promise.all(
                images.map((img) =>
                    img.complete
                        ? null
                        : new Promise((resolve) => {
                              img.onload = img.onerror = resolve;
                          }),
                ),
            );

            const [{ toPng }, { jsPDF }] = await Promise.all([
                import("html-to-image"),
                import("jspdf"),
            ]);

            const png = await toPng(node, {
                pixelRatio: 3,
                backgroundColor: "#ffffff",
                cacheBust: true,
            });

            const pdf = new jsPDF({
                unit: "in",
                format: [SLIP_WIDTH_IN, SLIP_HEIGHT_IN],
                orientation: "portrait",
            });

            pdf.addImage(png, "PNG", 0, 0, SLIP_WIDTH_IN, SLIP_HEIGHT_IN);

            pdf.save(`${document.tracking_number}.pdf`);
        } catch {
            setExportError("Could not create the PDF. Please try again.");
        } finally {
            setExporting(false);
        }
    };

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
                                Print this and attach it to the document. Use
                                full sheet for a new bond paper, or half sheet
                                for a leftover half.
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

                    <div className="flex justify-center overflow-x-auto px-7 py-6">
                        <div style={{ zoom: 0.6 }}>
                            <ReferenceSlip document={document} />
                        </div>
                    </div>

                    {exportError && (
                        <p
                            role="alert"
                            className="px-7 pb-2 text-base font-semibold text-red-600"
                        >
                            {exportError}
                        </p>
                    )}

                    <div className="flex flex-col-reverse gap-3 border-t border-line px-7 py-5 sm:flex-row sm:justify-end">
                        <EmployeeButton variant="quiet" onClick={onClose}>
                            Close
                        </EmployeeButton>

                        <EmployeeButton
                            variant="secondary"
                            onClick={exportPdf}
                            disabled={exporting}
                        >
                            <Icon name="download" />
                            {exporting ? "Preparing..." : "Export PDF"}
                        </EmployeeButton>

                        <EmployeeButton
                            variant="secondary"
                            onClick={() => printSlip("half")}
                        >
                            <Icon name="print" />
                            Print half sheet
                        </EmployeeButton>

                        <EmployeeButton onClick={() => printSlip("sheet")}>
                            <Icon name="print" />
                            Print full sheet
                        </EmployeeButton>
                    </div>
                </div>
            </div>

            <div
                aria-hidden="true"
                className="print:hidden"
                style={{ position: "fixed", left: "-10000px", top: 0 }}
            >
                <div ref={exportRef}>
                    <ReferenceSlip document={document} />
                </div>
            </div>

            {createPortal(
                <>
                    <style>{`
                        @media print {
                            @page {
                                ${
                                    printMode === "half"
                                        ? "size: 5.5in 8.5in; margin: 0.4in;"
                                        : "size: landscape; margin: 0.5in;"
                                }
                            }
                        }
                    `}</style>
                    <div id="print-root" className="hidden print:block">
                        <div
                            className={
                                printMode === "half"
                                    ? "flex justify-center"
                                    : "flex"
                            }
                        >
                            <ReferenceSlip document={document} landscape />
                        </div>
                    </div>
                </>,
                window.document.body,
            )}
        </>
    );
}
