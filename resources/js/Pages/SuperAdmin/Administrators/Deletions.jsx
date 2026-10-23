import { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

/*
 * Deletion requests from the sections.
 *
 * An employee cannot delete a referral. They ask, with a reason, and it
 * lands here. Approving marks the referral deleted - it stays in the
 * register, faded and unclickable - and rejecting returns it to normal.
 */

const when = (value) =>
    value
        ? new Date(value).toLocaleString("en-PH", {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : "—";

export default function Deletions() {
    const { requests, flash } = usePage().props;

    const [confirming, setConfirming] = useState(null); // { document, action }
    const [busy, setBusy] = useState(false);

    const rows = requests?.data ?? [];

    const submit = () => {
        const { document, action } = confirming;

        router.post(
            route(`super.deletions.${action}`, document.document_id),
            {},
            {
                preserveScroll: true,
                onStart: () => setBusy(true),
                onFinish: () => {
                    setBusy(false);
                    setConfirming(null);
                },
            },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-slate-900">
                            Deletion requests
                        </h2>

                        <p className="text-sm text-slate-500">
                            Referrals a section wants removed. Nothing is
                            deleted until you approve it.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href={route("super.deletions.history")}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            View history
                        </Link>

                        <Link
                            href={route("super.dashboard")}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            ← Back to overview
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Deletion requests" />

            <div className="bg-slate-50 py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    {rows.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                            <p className="text-lg font-semibold text-slate-800">
                                No pending deletion requests.
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                When a section asks to delete a referral, it
                                will show up here.
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {rows.map((document) => (
                                <li
                                    key={document.document_id}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-mono text-sm font-semibold text-slate-500">
                                                {document.tracking_number}
                                            </p>

                                            <p className="mt-1 text-lg font-bold text-slate-900">
                                                {document.taxpayer_name ||
                                                    document.concern ||
                                                    "No description"}
                                            </p>

                                            {document.taxpayer_name &&
                                                document.concern && (
                                                    <p className="mt-0.5 text-sm text-slate-600">
                                                        {document.concern}
                                                    </p>
                                                )}

                                            <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                                                <div>
                                                    <dt className="inline text-slate-500">
                                                        Section:{" "}
                                                    </dt>
                                                    <dd className="inline font-medium text-slate-800">
                                                        {document.creator
                                                            ?.section
                                                            ?.section_name ??
                                                            "—"}
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="inline text-slate-500">
                                                        Requested by:{" "}
                                                    </dt>
                                                    <dd className="inline font-medium text-slate-800">
                                                        {document.requester
                                                            ?.full_name ||
                                                            document.requester
                                                                ?.username ||
                                                            "—"}
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="inline text-slate-500">
                                                        Requested:{" "}
                                                    </dt>
                                                    <dd className="inline font-medium text-slate-800">
                                                        {when(
                                                            document.deletion_requested_at,
                                                        )}
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="inline text-slate-500">
                                                        Registered:{" "}
                                                    </dt>
                                                    <dd className="inline font-medium text-slate-800">
                                                        {when(
                                                            document.created_at,
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>

                                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                                <p className="text-sm font-semibold text-amber-900">
                                                    Reason for deletion
                                                </p>

                                                <p className="mt-1 whitespace-pre-wrap text-base text-slate-900">
                                                    {document.deletion_reason}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 gap-2 lg:flex-col">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setConfirming({
                                                        document,
                                                        action: "approve",
                                                    })
                                                }
                                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                                            >
                                                Approve deletion
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setConfirming({
                                                        document,
                                                        action: "reject",
                                                    })
                                                }
                                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {requests?.links?.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {requests.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url &&
                                        router.visit(link.url, {
                                            preserveScroll: true,
                                        })
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                        link.active
                                            ? "border-indigo-600 bg-indigo-600 text-white"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {confirming && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
                    role="alertdialog"
                    aria-modal="true"
                >
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900">
                            {confirming.action === "approve"
                                ? "Approve this deletion?"
                                : "Reject this request?"}
                        </h3>

                        <p className="mt-2 text-sm text-slate-600">
                            <span className="font-mono font-semibold">
                                {confirming.document.tracking_number}
                            </span>
                            {confirming.action === "approve"
                                ? " will be marked as deleted. It stays in the register, faded and unclickable, and can no longer be edited or routed."
                                : " goes back to normal and the section can work on it again."}
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => setConfirming(null)}
                                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={busy}
                                onClick={submit}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
                                    confirming.action === "approve"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-slate-700 hover:bg-slate-800"
                                }`}
                            >
                                {busy
                                    ? "Please wait…"
                                    : confirming.action === "approve"
                                      ? "Yes, approve"
                                      : "Yes, reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
