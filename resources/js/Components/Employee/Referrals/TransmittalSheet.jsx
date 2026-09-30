import { longDate, sectionLabel } from "./referral";

/*
 * The transmittal sheet, as it prints.
 *
 * A full page rather than a slip: this is a list, and the point of it is
 * the signature at the bottom. Laid out like the logbook page it
 * replaces - numbered rows, then "Released by" and "Received by" with
 * room to sign and to write a time.
 *
 * The time is left blank on purpose. It is written by whoever receives
 * the stack, at the moment they receive it, which is the whole value of
 * a paper receipt - a time the system printed is a time the system
 * believes, not one anybody witnessed.
 */

function Signature({ role, name }) {
    return (
        <div className="flex-1">
            <p className="text-[8px] tracking-wider uppercase">{role}</p>

            <div className="mt-6 border-b border-navy-900" />

            <p className="mt-1 text-[9px] font-semibold">{name || " "}</p>

            <p className="text-[7.5px] text-navy-800">
                Signature over printed name
            </p>

            <div className="mt-4 flex items-end gap-2">
                <span className="text-[8px] tracking-wider uppercase">
                    Date / Time
                </span>

                <span className="h-3 flex-1 border-b border-navy-900" />
            </div>
        </div>
    );
}

export default function TransmittalSheet({
    documents = [],
    fromSection,
    toSection,
    releasedBy,
}) {
    return (
        <div className="transmittal-sheet w-[7.6in] bg-white p-[0.25in] text-[10px] leading-snug text-navy-900">
            {/* Header */}
            <div className="flex items-start gap-3 border-b-2 border-navy-900 pb-2">
                <img
                    src="/images/bir-logo.png"
                    alt=""
                    className="h-11 w-11 shrink-0 object-contain"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                />

                <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold">
                        BUREAU OF INTERNAL REVENUE
                    </p>

                    <p className="text-[15px] font-bold tracking-wide">
                        TRANSMITTAL SHEET
                    </p>

                    <p className="text-[8.5px]">
                        Record of documents released to another section
                    </p>
                </div>

                <div className="shrink-0 text-right">
                    <p className="text-[8px] tracking-wider uppercase">
                        Date released
                    </p>

                    <p className="text-[11px] font-bold">
                        {longDate(new Date())}
                    </p>
                </div>
            </div>

            {/* Who to who */}
            <div className="mt-2 grid grid-cols-2 gap-4 border-b border-navy-900 pb-2">
                <div>
                    <p className="text-[8px] tracking-wider uppercase">From</p>
                    <p className="text-[12px] font-bold">
                        {sectionLabel(fromSection) || "—"}
                    </p>
                </div>

                <div>
                    <p className="text-[8px] tracking-wider uppercase">To</p>
                    <p className="text-[12px] font-bold">
                        {sectionLabel(toSection) || "—"}
                    </p>
                </div>
            </div>

            {/* The documents */}
            <table className="mt-2 w-full border-collapse">
                <thead>
                    <tr className="border-b border-navy-900 text-left text-[8px] tracking-wider uppercase">
                        <th className="w-[0.4in] py-1 pr-2">No.</th>
                        <th className="w-[1.7in] py-1 pr-2">Reference No.</th>
                        <th className="py-1 pr-2">Taxpayer</th>
                        <th className="w-[1.9in] py-1 pr-2">Concern</th>
                        <th className="w-[1.1in] py-1">Registered</th>
                    </tr>
                </thead>

                <tbody>
                    {documents.map((document, index) => (
                        <tr
                            key={document.document_id}
                            className="border-b border-navy-200 align-top"
                        >
                            <td className="py-1.5 pr-2">{index + 1}</td>

                            <td className="py-1.5 pr-2 font-mono text-[9px]">
                                {document.tracking_number}
                            </td>

                            <td className="py-1.5 pr-2 font-semibold">
                                {document.taxpayer_name ?? "—"}
                            </td>

                            <td className="py-1.5 pr-2">
                                {document.concern ?? "—"}
                            </td>

                            <td className="py-1.5">
                                {longDate(document.document_date) || "—"}
                            </td>
                        </tr>
                    ))}

                    {documents.length === 0 && (
                        <tr>
                            <td colSpan="5" className="py-6 text-center">
                                Nothing to transmit.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <p className="mt-2 border-t border-navy-900 pt-1.5 text-[9px]">
                <span className="font-bold">{documents.length}</span> document
                {documents.length === 1 ? "" : "s"} released. Nothing below this
                line.
            </p>

            {/* The point of the whole sheet */}
            <div className="mt-6 flex gap-10">
                <Signature role="Released by" name={releasedBy} />
                <Signature role="Received by" name="" />
            </div>
        </div>
    );
}
