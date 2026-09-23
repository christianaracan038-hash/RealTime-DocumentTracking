/*
 * How a waiting document is dressed.
 *
 * One definition of each urgency state, used by the badge, the queue
 * cards and the receive dialog, so a document that is late looks late
 * everywhere it appears.
 *
 * Colour is never the only signal: every state carries a word and an
 * icon as well, for anyone who cannot separate red from green.
 */

export const URGENCY = {
    fresh: {
        label: "On time",
        icon: "check",
        spine: "bg-ok-600",
        card: "bg-white",
        pill: "bg-ok-100 text-ok-600",
        dot: "bg-ok-600",
        band: "bg-ok-600",
    },

    aging: {
        label: "Getting late",
        icon: "date",
        spine: "bg-warn-500",
        card: "bg-warn-50",
        pill: "bg-warn-100 text-warn-700",
        dot: "bg-warn-500",
        band: "bg-warn-600",
    },

    late: {
        label: "Late",
        icon: "warning",
        spine: "bg-stop-600",
        card: "bg-stop-50",
        pill: "bg-stop-100 text-stop-600",
        dot: "bg-stop-600",
        band: "bg-stop-600",
    },

    overdue: {
        label: "Overdue",
        icon: "warning",
        spine: "bg-stop-600",
        card: "bg-stop-50",
        pill: "bg-stop-600 text-white",
        dot: "bg-white",
        band: "bg-stop-600",
    },
};

/**
 * Which state a document is in, or null once it has been received and
 * the clock has stopped.
 */
export function urgencyOf(document) {
    const aging = document?.aging;

    if (!aging) return null;

    return URGENCY[aging.overdue ? "overdue" : aging.band] ?? URGENCY.fresh;
}
