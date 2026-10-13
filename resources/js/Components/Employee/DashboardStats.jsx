import { Link } from "@inertiajs/react";

import Icon from "@/Components/Employee/Icon";

const TONES = {
    plain: {
        shell: "border-line bg-surface hover:border-brand-600",
        label: "text-black",
        value: "text-black",
        hint: "text-black",
        icon: "bg-brand-50 text-brand-700",
    },
    blue: {
        shell: "border-blue-600 bg-blue-600 hover:bg-blue-700 hover:border-blue-700",
        label: "text-white",
        value: "text-white",
        hint: "text-blue-100",
        icon: "bg-white/20 text-white",
    },
    stop: {
        shell: "border-stop-600 bg-stop-50 hover:border-stop-600",
        label: "text-stop-600",
        value: "text-stop-600",
        hint: "text-black",
        icon: "bg-stop-600 text-white",
    },
};

function Stat({
    label,
    value,
    hint,
    icon,
    href,
    tone = "plain",
    labelClassName = "text-base font-semibold",
}) {
    const activeTone = tone === "stop" && !(value > 0) ? "plain" : tone;
    const colors = TONES[activeTone] ?? TONES.plain;

    const body = (
        <>
            <span className="flex items-start justify-between gap-3">
                <span className={`${labelClassName} ${colors.label}`}>
                    {label}
                </span>

                <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}
                >
                    <Icon name={icon} />
                </span>
            </span>

            <span className={`mt-2 block text-4xl font-bold ${colors.value}`}>
                {value}
            </span>

            <span className={`mt-1 block text-sm ${colors.hint}`}>{hint}</span>
        </>
    );

    const shell = `flex flex-col rounded-2xl border p-5 shadow-sm shadow-navy-900/5 transition ${colors.shell}`;

    if (!href) {
        return <div className={shell}>{body}</div>;
    }

    return (
        <Link href={href} className={shell}>
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
                tone="blue"
            />

            <Stat
                label="On your desk"
                value={onDesk}
                hint={onDesk === 0 ? "You have no documents on hand" : ""}
                icon="documents"
                href={route("documents.index")}
                tone="blue"
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
