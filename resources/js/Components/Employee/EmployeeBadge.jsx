/*
 * Document status, shown as a pill.
 *
 * Pending wears the attention yellow, because a pending document is
 * work waiting for someone. Received is green and settled. Colour is
 * never the only signal - the word is always there too.
 */

const TONES = {
    Pending: "bg-accent-400 text-navy-900",
    Received: "bg-ok-100 text-ok-600",
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
