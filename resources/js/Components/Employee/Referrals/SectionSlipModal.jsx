import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import { exactTime, sectionLabel } from "./referral";

const SLIP_WIDTH_IN = 8.5;
const SLIP_HEIGHT_IN = 5.5;

function HeaderCell({ label, section, direction }) {
    return (
        <div className="flex flex-col border-l-2 border-navy-900 px-4 py-3">
            <p className="text-[14px] font-bold">{label}</p>

            <p className="text-[13px]">{sectionLabel(section) || "—"}</p>

            <p className="mt-3 text-center text-[15px] font-bold">Signature</p>

            <p className="text-center text-[12px]">({direction})</p>

            <div className="flex-1" />
        </div>
    );
}

export function SectionSlip({ document }) {
    return (
        <div className="section-slip grid h-[5.5in] w-[8.5in] grid-cols-[1.25fr_1fr_1fr] grid-rows-[1.7fr_1fr_1fr_1fr_1fr] border-2 border-navy-900 bg-white text-navy-900">
            <div className="row-span-5 flex flex-col px-4 py-3">
                <div className="flex shrink-0 items-center gap-3">
                    <img
                        src={route("documents.qr", document.document_id)}
                        alt={`QR code for ${document.tracking_number}`}
                        className="h-[1.3in] w-[1.3in] shrink-0"
                    />

                    <div className="min-w-0 flex-1 text-right">
                        <p className="font-mono text-[18px] font-bold leading-tight break-all">
                            {document.tracking_number}
                        </p>

                        <p className="mt-1 text-[12px] italic">
                            {exactTime(document.created_at)}
                        </p>
                    </div>
                </div>

                <p className="mt-4 text-[15px] font-bold">Details</p>

                <p className="mt-2 flex-1 text-[13px] leading-relaxed whitespace-pre-wrap">
                    {document.concern || " "}
                </p>
            </div>

            <HeaderCell
                label="Prepared:"
                section={document.creator?.section}
                direction="Outgoing"
            />

            <HeaderCell
                label="Received:"
                section={document.destination_section}
                direction="Incoming"
            />

            {Array.from({ length: 8 }).map((_, index) => (
                <div
                    key={index}
                    className="border-l-2 border-t-2 border-navy-900"
                />
            ))}
        </div>
    );
}

export default function SectionSlipModal({ document, onClose }) {
    const exportRef = useRef(null);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState("");

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();

        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!document) return null;

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
                orientation: "landscape",
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

                    <div className="overflow-x-auto px-7 py-6">
                        <div style={{ zoom: 0.72 }}>
                            <SectionSlip document={document} />
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

                        <EmployeeButton onClick={() => window.print()}>
                            <Icon name="print" />
                            Print slip
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
                    <SectionSlip document={document} />
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
