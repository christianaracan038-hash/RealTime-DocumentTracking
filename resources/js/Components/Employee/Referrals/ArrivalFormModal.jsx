import { useEffect } from "react";
import { useForm } from "@inertiajs/react";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import { longDate, sectionLabel } from "./referral";

/*
 * Step 1 - registering a document's arrival.
 *
 * One field: the taxpayer's name. That is all anybody has time to type
 * with somebody standing at the counter, and it is enough to mint the
 * reference number and start the clock.
 *
 * The date is shown but cannot be touched. It is stamped by the server
 * when the record saves - the office asked for a date nobody can set,
 * and a disabled input would only stop an honest clerk. See
 * StoreDocumentRequest, which does not accept one at all.
 *
 * Everything else is step 2, in DetailsFormModal - including where the
 * document is going, which needs it read properly rather than guessed at
 * with somebody waiting.
 */

const FIELD =
    "min-h-12 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-navy-900 placeholder:text-muted focus:border-brand-600";

function Field({ label, hint, error, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-base font-semibold text-navy-800">
                {label}
            </label>

            {hint && <p className="mb-2 text-sm text-muted">{hint}</p>}

            {children}

            {error && (
                <p className="mt-2 text-sm font-medium text-stop-600">
                    {error}
                </p>
            )}
        </div>
    );
}

export default function ArrivalFormModal({
    open,
    onClose,
    fromSection = null,
}) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            taxpayer_name: "",
        });

    useEffect(() => {
        if (!open) return;

        const onKey = (e) => e.key === "Escape" && !processing && onClose();
        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [open, processing]);

    if (!open) return null;

    const submit = (e) => {
        e.preventDefault();

        post(route("documents.store"), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                onClose();
            },
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/70 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="arrival-form-title"
        >
            <div className="w-full max-w-xl rounded-2xl bg-surface">
                <div className="flex items-start justify-between gap-4 border-b border-line px-7 py-5">
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                            Step 1 of 2
                        </p>

                        <h2
                            id="arrival-form-title"
                            className="mt-1 text-2xl font-bold text-navy-900"
                        >
                            Register
                        </h2>

                        <p className="mt-1 text-base text-muted">
                            Initial referral registration and timestamping are
                            completed at the service counter. The system
                            generates a unique reference number and starts the
                            processing clock upon saving, while routing
                            information and subsequent workflow details are
                            completed during downstream processing.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        aria-label="Close"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl leading-none text-muted transition hover:bg-sunken hover:text-navy-900"
                    >
                        <Icon name="close" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-6 px-7 py-6">
                    <Field label="Taxpayer's Name" error={errors.taxpayer_name}>
                        <input
                            type="text"
                            value={data.taxpayer_name}
                            onChange={(e) =>
                                setData("taxpayer_name", e.target.value)
                            }
                            placeholder="e.g. Juan Dela Cruz"
                            autoFocus
                            className={FIELD}
                        />
                    </Field>

                    {/*
                     * Shown, not asked for. The server stamps it on save,
                     * so this is what it will be rather than what anybody
                     * chose.
                     */}
                    <Field label="Date Issued">
                        <div className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-sunken px-4 py-3">
                            <Icon name="date" className="text-muted" />

                            <span className="text-base font-semibold text-navy-900">
                                {longDate(new Date())}
                            </span>

                            <span className="ml-auto text-sm text-muted">
                                Set automatically
                            </span>
                        </div>
                    </Field>

                    <div className="rounded-xl bg-sunken px-4 py-3">
                        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                            From
                        </p>
                        <p className="mt-0.5 text-base font-semibold text-navy-900">
                            {fromSection ? sectionLabel(fromSection) : "—"}
                        </p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
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
                            size="lg"
                            disabled={processing}
                        >
                            <Icon name="register" />
                            {processing ? "Registering..." : "Register"}
                        </EmployeeButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
