import Icon from "./Icon";
import { urgencyOf } from "./urgency";
import { exactTime, waitedFor } from "./Referrals/referral";

/*
 * How long a document has been waiting, and whether that is a problem.
 *
 * Reads as a status, not a note: an icon, the word, and the time waited,
 * on a filled pill. Overdue is filled solid with a pulsing dot, because
 * it is the one state someone must not scroll past.
 *
 * The colours come from urgency.js, so the badge, the queue card and the
 * receive dialog all agree about what "late" looks like.
 */

const SIZES = {
    sm: "px-2.5 py-1 text-sm gap-1.5",
    md: "px-3 py-1.5 text-base gap-2",
};

export default function AgeBadge({
    document,
    showSince = false,
    size = "sm",
    className = "",
}) {
    const urgency = urgencyOf(document);

    if (!urgency) return null;

    const isOverdue = document.aging.overdue;

    return (
        <span
            className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}
        >
            <span
                className={`inline-flex items-center rounded-full font-bold whitespace-nowrap ${
                    urgency.pill
                } ${SIZES[size] ?? SIZES.sm} ${
                    isOverdue ? "ring-2 ring-stop-600 ring-offset-1" : ""
                }`}
            >
                {isOverdue ? (
                    <span
                        className="relative flex h-2.5 w-2.5"
                        aria-hidden="true"
                    >
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                    </span>
                ) : (
                    <Icon name={urgency.icon} />
                )}
                {urgency.label} &middot; {waitedFor(document.aging.hours)}
            </span>

            {showSince && document.waiting_since && (
                <span className="text-sm text-muted">
                    since {exactTime(document.waiting_since)}
                </span>
            )}
        </span>
    );
}
