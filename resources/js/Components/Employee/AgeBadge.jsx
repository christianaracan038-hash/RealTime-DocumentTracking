import { exactTime, waitedFor } from "./Referrals/referral";

/*
 * How long a document has been waiting, coloured against the office's
 * two-day target. Green under six hours, yellow up to a day, red past
 * that, and "Overdue" once it crosses the line.
 *
 * Colour is never the only signal: the badge always carries the time
 * waited and, in the fuller form, the exact moment the wait began.
 *
 * `aging` and `waiting_since` come from the Document model, so every
 * screen agrees on the numbers.
 */

const BANDS = {
    fresh: {
        dot: "bg-ok-600",
        pill: "bg-ok-100 text-ok-600",
        label: "On time",
    },
    aging: {
        dot: "bg-accent-600",
        pill: "bg-accent-100 text-navy-900",
        label: "Getting late",
    },
    late: {
        dot: "bg-stop-600",
        pill: "bg-stop-100 text-stop-600",
        label: "Late",
    },
};

export default function AgeBadge({
    document,
    showSince = false,
    className = "",
}) {
    const aging = document?.aging;

    if (!aging) return null;

    const band = BANDS[aging.band] ?? BANDS.fresh;
    const label = aging.overdue ? "Overdue" : band.label;

    return (
        <span
            className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}
        >
            <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold whitespace-nowrap ${band.pill} ${
                    aging.overdue ? "ring-2 ring-stop-600" : ""
                }`}
            >
                <span
                    aria-hidden="true"
                    className={`h-2 w-2 rounded-full ${band.dot}`}
                />
                {label} &middot; {waitedFor(aging.hours)}
            </span>

            {showSince && document.waiting_since && (
                <span className="text-sm text-muted">
                    since {exactTime(document.waiting_since)}
                </span>
            )}
        </span>
    );
}
