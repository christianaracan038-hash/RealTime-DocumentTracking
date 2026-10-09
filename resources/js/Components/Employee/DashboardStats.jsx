import { Link } from "@inertiajs/react";

import Icon from "@/Components/Employee/Icon";

function Stat({
    label,
    value,
    hint,
    icon,
    href,
    tone = "plain",
    labelClassName = "text-base font-semibold",
}) {
    const toned = tone === "stop" && value > 0;

    const body = (
        <>
            <span className="flex items-start justify-between gap-3">
                <span
                    className={`${labelClassName} ${
                        toned ? "text-stop-600" : "text-black"
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
                    toned ? "text-stop-600" : "text-black"
                }`}
            >
                {value}
            </span>

            <span className="mt-1 block text-sm text-black">{hint}</span>
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
                label="Waiting to be received"
                value={waiting}
                hint={
                    waiting === 0
                        ? ""
                        : "Sent to your section but not yet received"
                }
                icon="inbox"
            />

            <Stat
                label="On your desk"
                value={onDesk}
                hint={onDesk === 0 ? "You have no documents on hand" : ""}
                icon="documents"
                href={route("documents.index")}
            />

            <Stat
                label="Overdue"
                value={overdue}
                hint={overdue === 0 ? "" : "Waiting for more than two days"}
                icon="warning"
                tone="stop"
                labelClassName="text-xl font-bold"
            />
        </div>
    );
}
