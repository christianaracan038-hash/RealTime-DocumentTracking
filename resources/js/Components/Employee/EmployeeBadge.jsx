/*
 * Document status, shown as a pill.
 *
 * Draft is neutral slate - it hasn't started its journey yet. Pending
 * wears the attention yellow, because a pending document is work
 * waiting for someone. Received is green and settled. Completed is
 * brand blue - done, on purpose. Archived is a muted slate too, but
 * distinct from Draft in meaning: this one stopped because the
 * taxpayer went unresponsive, not because it hasn't started. Colour
 * is never the only signal - the word is always there too.
 */

const TONES = {
    Draft: "bg-navy-100 text-navy-600",
    Pending: "bg-accent-400 text-navy-900",
    Received: "bg-ok-100 text-ok-600",
    Completed: "bg-brand-100 text-brand-700",
    Archived: "bg-navy-200 text-navy-700",
};

export default function EmployeeBadge({ status, className = "" }) {
    const label = status ?? "Unknown";

    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap ${
                TONES[label] ?? "bg-navy-200 text-navy-800"
            } ${className}`}
        >
            {label}
        </span>
    );
}
