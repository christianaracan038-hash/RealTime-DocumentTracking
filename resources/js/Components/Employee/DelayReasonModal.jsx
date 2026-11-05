import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { router, usePage } from "@inertiajs/react";

import Icon from "./Icon";
import EmployeeButton from "./EmployeeButton";

/*
 * Modal to add or view a delay reason for an overdue document.
 *
 * delayReason is an object: { id, body, author_id, author_name,
 * created_at, acknowledged } or null when none exists yet.
 * Editable when there is no reason yet, or when the current employee
 * wrote it. The backend still has the final say on authorization.
 */

export default function DelayReasonModal({
    document: doc,
    delayReason = null,
    open = false,
    onClose,
}) {
    const { auth } = usePage().props;
    const [body, setBody] = useState(delayReason?.body ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    if (!open || !doc) return null;

    const isAuthor =
        delayReason?.author_id != null &&
        Number(delayReason.author_id) === Number(auth?.employee?.employee_id);

    const canEdit = !delayReason || isAuthor;

    const finish = () => {
        router.reload({ only: ["documents"] });
        onClose();
    };

    const saveDelayReason = async () => {
        if (!body.trim()) return;

        setSaving(true);
        setError(null);

        try {
            await axios.post(
                route("api.documents.delay-reason.store", doc.document_id),
                { body: body.trim() },
            );
            finish();
        } catch (err) {
            setError(
                err.response?.data?.errors?.body?.[0] ??
                    err.response?.data?.message ??
                    "Could not save the delay reason.",
            );
        } finally {
            setSaving(false);
        }
    };

    const removeDelayReason = async () => {
        if (!window.confirm("Remove this delay reason?")) return;

        setSaving(true);
        setError(null);

        try {
            await axios.delete(
                route("api.documents.delay-reason.destroy", doc.document_id),
            );
            finish();
        } catch (err) {
            setError(
                err.response?.data?.message ??
                    "Could not remove the delay reason.",
            );
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-start justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-black">
                        <Icon name="warning" className="text-stop-600" />
                        Delay Notice
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-muted transition hover:text-black"
                        aria-label="Close"
                    >
                        <Icon name="close" />
                    </button>
                </div>

                <p className="mb-4 text-sm text-black">
                    Document{" "}
                    <span className="font-mono font-semibold text-black">
                        {doc.tracking_number}
                    </span>{" "}
                    has a taxpayer issue or delay. What is the problem?
                </p>

                {canEdit ? (
                    <div className="mb-4">
                        <label className="mb-1 block text-sm font-semibold text-black">
                            Delay Reason
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={4}
                            maxLength={1000}
                            autoFocus
                            placeholder="e.g. Waiting for taxpayer's ID copy..."
                            className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-base text-black focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                        />
                    </div>
                ) : (
                    <div className="mb-4 rounded-lg border border-accent-200 bg-accent-100 p-3">
                        <p className="whitespace-pre-line text-sm text-black">
                            {delayReason?.body}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-black">
                            <span>{delayReason?.author_name ?? "Unknown"}</span>
                            {delayReason?.created_at && (
                                <>
                                    <span>·</span>
                                    <span>
                                        {new Date(
                                            delayReason.created_at,
                                        ).toLocaleString()}
                                    </span>
                                </>
                            )}
                            {delayReason?.acknowledged ? (
                                <span className="font-semibold text-ok-600">
                                    ✓ Acknowledged
                                </span>
                            ) : (
                                <span className="font-semibold text-stop-600">
                                    Not yet seen
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {error && (
                    <p className="mb-3 text-sm font-medium text-stop-600">
                        {error}
                    </p>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    {canEdit && delayReason && (
                        <EmployeeButton
                            type="button"
                            variant="secondary"
                            onClick={removeDelayReason}
                            disabled={saving}
                        >
                            Remove
                        </EmployeeButton>
                    )}

                    <EmployeeButton
                        type="button"
                        onClick={canEdit ? saveDelayReason : onClose}
                        disabled={saving || (canEdit && !body.trim())}
                    >
                        {saving ? "Saving…" : canEdit ? "Save Reason" : "Close"}
                    </EmployeeButton>
                </div>
            </div>
        </div>,
        window.document.body,
    );
}
