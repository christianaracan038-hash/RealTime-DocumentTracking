import { useEffect, useRef, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

/*
 * The audit log.
 *
 * Read-only, and there is nothing here that deletes - the model refuses
 * it. An administrator who can tidy the record of what administrators
 * did has made the record worthless.
 */

const GROUPS = [
    { key: "", label: "Everything" },
    { key: "login", label: "Signing in and out" },
    { key: "failed", label: "Failed attempts" },
    { key: "employees", label: "Employee accounts" },
    { key: "administrators", label: "Administrators" },
];

/*
 * How each action reads in English, and how loud it is. Anything that
 * grants or revokes access is marked; the rest is ordinary traffic.
 */
const ACTIONS = {
    login: { text: "signed in", tone: "quiet" },
    logout: { text: "signed out", tone: "quiet" },
    "login.failed": { text: "failed to sign in", tone: "warn" },

    "employee.created": { text: "created employee", tone: "loud" },
    "employee.updated": { text: "edited employee", tone: "plain" },
    "employee.password_reset": { text: "reset password of", tone: "loud" },
    "employee.deactivated": { text: "deactivated employee", tone: "loud" },
    "employee.reactivated": { text: "reactivated employee", tone: "loud" },
    "employee.photo_set": { text: "set photo of", tone: "quiet" },
    "employee.photo_removed": { text: "removed photo of", tone: "quiet" },

    "administrator.created": { text: "created ADMINISTRATOR", tone: "loud" },
    "administrator.updated": { text: "edited administrator", tone: "plain" },
    "administrator.password_reset": {
        text: "reset password of ADMINISTRATOR",
        tone: "loud",
    },
    "administrator.deactivated": {
        text: "deactivated ADMINISTRATOR",
        tone: "loud",
    },
    "administrator.reactivated": {
        text: "reactivated ADMINISTRATOR",
        tone: "loud",
    },
};

const TONES = {
    quiet: "text-slate-500",
    plain: "text-slate-700",
    warn: "text-amber-700 font-semibold",
    loud: "text-indigo-700 font-semibold",
};

const STAMP = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
});

function Entry({ entry }) {
    const action = ACTIONS[entry.action] ?? {
        text: entry.action,
        tone: "plain",
    };

    const context = entry.context ?? {};

    return (
        <tr className={action.tone === "warn" ? "bg-amber-50/60" : ""}>
            <td className="w-48 px-4 py-2.5 align-top font-mono text-xs whitespace-nowrap text-slate-500">
                {STAMP.format(new Date(entry.created_at))}
            </td>

            <td className="px-4 py-2.5 align-top">
                <span className="font-medium text-slate-800">
                    {entry.actor_label ?? (
                        <span className="text-slate-400">not signed in</span>
                    )}
                </span>

                <span className={`mx-1.5 ${TONES[action.tone]}`}>
                    {action.text}
                </span>

                {entry.subject_label && (
                    <span className="font-medium text-slate-800">
                        {entry.subject_label}
                    </span>
                )}

                {/* What they typed, when nobody was signed in */}
                {context.tried && (
                    <span className="ml-1 text-slate-600">
                        as{" "}
                        <span className="font-mono text-xs">
                            {context.tried}
                        </span>
                        {context.account_exists === false && (
                            <span className="ml-1 text-slate-400">
                                (no such account)
                            </span>
                        )}
                    </span>
                )}

                {Array.isArray(context.changed) &&
                    context.changed.length > 0 && (
                        <span className="ml-1 text-slate-500">
                            &mdash; {context.changed.join(", ")}
                        </span>
                    )}
            </td>

            <td className="w-36 px-4 py-2.5 align-top font-mono text-xs whitespace-nowrap text-slate-500">
                {entry.ip ?? "—"}
            </td>
        </tr>
    );
}

export default function Index() {
    const { entries, filters, recentFailures, total } = usePage().props;

    const [search, setSearch] = useState(filters?.search ?? "");

    const first = useRef(true);

    useEffect(() => {
        if (first.current) {
            first.current = false;

            return;
        }

        const timer = setTimeout(() => {
            router.get(
                route("super.audit.index"),
                {
                    search: search || undefined,
                    group: filters?.group || undefined,
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const rows = entries?.data ?? [];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl leading-tight font-semibold text-slate-900">
                            Audit log
                        </h2>

                        <p className="text-sm text-slate-500">
                            Who signed in, and who changed what. Nothing here
                            can be edited or deleted.
                        </p>
                    </div>

                    <p className="text-sm text-slate-500">
                        {total?.toLocaleString?.() ?? total} entries
                    </p>
                </div>
            }
        >
            <Head title="Audit log" />

            <div className="bg-slate-50 py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {recentFailures > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            <strong>{recentFailures}</strong> failed sign-in
                            attempt{recentFailures === 1 ? "" : "s"} in the last
                            seven days. A run of them against one username is
                            worth looking at.
                        </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap gap-2">
                            {GROUPS.map((group) => {
                                const current =
                                    (filters?.group ?? "") === group.key;

                                return (
                                    <button
                                        key={group.key || "all"}
                                        type="button"
                                        onClick={() =>
                                            router.get(
                                                route("super.audit.index"),
                                                {
                                                    group:
                                                        group.key || undefined,
                                                    search: search || undefined,
                                                },
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                },
                                            )
                                        }
                                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                            current
                                                ? "bg-indigo-600 text-white"
                                                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        {group.label}
                                    </button>
                                );
                            })}
                        </div>

                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search a name, account or action..."
                            className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:w-72"
                        />
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                        When
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                        What happened
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                        From
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 bg-white">
                                {rows.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="px-4 py-12 text-center text-slate-500"
                                        >
                                            {search || filters?.group
                                                ? "Nothing matches that."
                                                : "Nothing recorded yet. The log starts from the day it was built."}
                                        </td>
                                    </tr>
                                )}

                                {rows.map((entry) => (
                                    <Entry
                                        key={entry.audit_log_id}
                                        entry={entry}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {entries?.links?.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {entries.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url &&
                                        router.visit(link.url, {
                                            preserveState: true,
                                            preserveScroll: true,
                                        })
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                        link.active
                                            ? "bg-indigo-600 text-white"
                                            : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
