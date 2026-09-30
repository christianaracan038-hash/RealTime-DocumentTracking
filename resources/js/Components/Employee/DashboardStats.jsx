import { Link } from "@inertiajs/react";

import Icon from "@/Components/Employee/Icon";

/*
 * The three numbers the office reads first thing in the morning: what has
 * arrived, what is already in your hands, and what has gone past the
 * two-day limit.
 *
 * Only the last one is coloured, and only when it is not zero. A row of
 * three red-edged cards would say nothing - the point of the colour is
 * that most mornings it is absent, so the morning it appears you notice.
 */

function Stat({ label, value, hint, icon, href, tone = "plain" }) {
    const toned = tone === "stop" && value > 0;

    const body = (
        <>
            <span className="flex items-start justify-between gap-3">
                <span
                    className={`text-base font-semibold ${
                        toned ? "text-stop-600" : "text-muted"
                    }`}
                >
                    {label}
                </span>

                <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        toned
                            ? "bg-stop-600 text-white"
                            : "bg-brand-50 text-brand-700"
                    }`}
                >
                    <Icon name={icon} />
                </span>
            </span>

            <span
                className={`mt-2 block text-4xl font-bold ${
                    toned ? "text-stop-600" : "text-navy-900"
                }`}
            >
                {value}
            </span>

            <span className="mt-1 block text-sm text-muted">{hint}</span>
        </>
    );

    const shell = `flex flex-col rounded-2xl border p-5 shadow-sm shadow-navy-900/5 transition ${
        toned ? "border-stop-600 bg-stop-50" : "border-line bg-surface"
    }`;

    if (!href) {
        return <div className={shell}>{body}</div>;
    }

    return (
        <Link href={href} className={`${shell} hover:border-brand-600`}>
            {body}
        </Link>
    );
}

export default function DashboardStats({ stats = {} }) {
    const waiting = stats.waiting ?? 0;
    const onDesk = stats.onDesk ?? 0;
    const overdue = stats.overdue ?? 0;

    return (
        <div className="grid gap-4 sm:grid-cols-3">
            <Stat
                label="Waiting to receive"
                value={waiting}
                hint={
                    waiting === 0
                        ? "Nothing has arrived"
                        : "Sent to your section"
                }
                icon="inbox"
            />

            <Stat
                label="On your desk"
                value={onDesk}
                hint={
                    onDesk === 0
                        ? "You are holding nothing"
                        : "Received, not yet moved on"
                }
                icon="documents"
                href={route("documents.index")}
            />

            <Stat
                label="Past the two-day limit"
                value={overdue}
                hint={
                    overdue === 0
                        ? "Everything is within time"
                        : "Waiting longer than two days"
                }
                icon="warning"
                tone="stop"
            />
        </div>
    );
}
