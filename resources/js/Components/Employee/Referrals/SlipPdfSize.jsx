import { useEffect, useRef, useState } from "react";

import { ReferenceSlip } from "./ReferenceSlipModal";
import { SectionSlip } from "./SectionSlipModal";
import { buildSlipPdf, formatMb } from "./exportPdf";

const VARIANTS = {
    section: {
        Slip: SectionSlip,
        width: 8.5,
        height: 5.5,
        orientation: "landscape",
    },
    2309: {
        Slip: ReferenceSlip,
        width: 4.3,
        height: 8,
        orientation: "portrait",
    },
};

export default function SlipPdfSize({ document, variant }) {
    const nodeRef = useRef(null);
    const [size, setSize] = useState({ status: "loading", bytes: null });

    const { Slip, ...dimensions } = VARIANTS[variant] ?? VARIANTS["2309"];

    useEffect(() => {
        let cancelled = false;

        setSize({ status: "loading", bytes: null });

        buildSlipPdf(nodeRef.current, dimensions)
            .then(({ bytes }) => {
                if (!cancelled) setSize({ status: "ready", bytes });
            })
            .catch((error) => {
                if (cancelled) return;

                setSize({
                    status:
                        error.message === "PDF is larger than 5 MB"
                            ? "toolarge"
                            : "error",
                    bytes: null,
                });
            });

        return () => {
            cancelled = true;
        };
    }, [document.document_id, variant]);

    const label = {
        loading: "Calculating...",
        ready: formatMb(size.bytes ?? 0),
        toolarge: "Over 5 MB",
        error: "Unavailable",
    }[size.status];

    return (
        <div className="contents">
            <dt className="text-sm font-semibold text-black">PDF size</dt>
            <dd className="text-base text-black">
                {label}

                <div
                    aria-hidden="true"
                    className="print:hidden"
                    style={{ position: "fixed", left: "-10000px", top: 0 }}
                >
                    <div ref={nodeRef}>
                        <Slip document={document} />
                    </div>
                </div>
            </dd>
        </div>
    );
}
