import { createPortal } from "react-dom";
import { useForm } from "@inertiajs/react";

import Icon from "./Icon";
import EmployeeButton from "./EmployeeButton";

export default function RemarksModal({ document: doc, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        body: "",
    });

    if (!doc) return null;

    const submit = (e) => {
        e.preventDefault();

        post(route("documents.remarks.store", doc.document_id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
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

            <form
                onSubmit={submit}
                className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl"
            >
                <div className="mb-4 flex items-start justify-between">
                    <h2 className="text-lg font-bold text-black">
                        Add remarks
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
                    <span className="font-mono font-semibold">
                        {doc.tracking_number}
                    </span>
                    . This will appear in the document&apos;s history, and you
                    will be shown as its current holder.
                </p>

                <textarea
                    value={data.body}
                    onChange={(e) => setData("body", e.target.value)}
                    rows={4}
                    maxLength={1000}
                    autoFocus
                    placeholder="e.g. Under review by Juan. Taxpayer to submit ID copy."
                    className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-base text-black focus:border-brand-600"
                />

                {errors.body && (
                    <p className="mt-2 text-sm font-medium text-stop-600">
                        {errors.body}
                    </p>
                )}

                <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <EmployeeButton
                        type="button"
                        variant="quiet"
                        onClick={onClose}
                        disabled={processing}
                    >
                        Cancel
                    </EmployeeButton>

                    <EmployeeButton
                        type="submit"
                        disabled={processing || !data.body.trim()}
                    >
                        {processing ? "Saving..." : "Save remarks"}
                    </EmployeeButton>
                </div>
            </form>
        </div>,
        window.document.body,
    );
}
