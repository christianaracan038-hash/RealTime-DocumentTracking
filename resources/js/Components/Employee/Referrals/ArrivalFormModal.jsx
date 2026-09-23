import { useEffect } from "react";
import { useForm } from "@inertiajs/react";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import DateField, { today } from "@/Components/Employee/DateField";
import { sectionLabel } from "./referral";

/*
 * Step 1 - registering a document's arrival.
 *
 * Deliberately short. Four fields, all readable off the paper in
 * seconds, so it can be done at the counter the moment the document
 * lands instead of in the evening. Saving starts the clock and produces
 * the tracking number and QR.
 *
 * The descriptive fields - concerns, what is being asked for, remarks -
 * are step 2, in DetailsFormModal.
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
    sections = [],
    options = {},
    fromSection = null,
}) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            document_date: today(),
            taxpayer_name: "",
            destination_section_id: "",
            addressee: "",
        });

    useEffect(() => {
        if (!open) return;

        const onKey = (e) => e.key === "Escape" && !processing && onClose();
        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [open, processing]);

    if (!open) return null;

    const chosenSection = sections.find(
        (s) => String(s.section_id) === String(data.destination_section_id),
    );

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
            <div className="w-full max-w-xl rounded-2xl bg-white">
                <div className="flex items-start justify-between gap-4 border-b border-line px-7 py-5">
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                            Step 1 of 2
                        </p>

                        <h2
                            id="arrival-form-title"
                            className="mt-1 text-2xl font-bold text-navy-900"
                        >
                            Register arrival
                        </h2>

                        <p className="mt-1 text-base text-muted">
                            Saving starts the clock and creates the QR code. The
                            concerns and remarks can be filled in later.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        aria-label="Close"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl leading-none text-muted transition hover:bg-paper hover:text-navy-900"
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

                    <Field label="Date Issued" error={errors.document_date}>
                        <DateField
                            id="document_date"
                            value={data.document_date}
                            onChange={(value) =>
                                setData("document_date", value)
                            }
                        />
                    </Field>

                    <Field
                        label="Receiving Section"
                        error={errors.destination_section_id}
                    >
                        <select
                            value={data.destination_section_id}
                            onChange={(e) => {
                                setData(
                                    "destination_section_id",
                                    e.target.value,
                                );
                                setData("addressee", "");
                            }}
                            className={FIELD}
                        >
                            <option value="">Select</option>
                            {sections.map((s) => (
                                <option key={s.section_id} value={s.section_id}>
                                    {sectionLabel(s)}
                                </option>
                            ))}
                        </select>
                    </Field>

                    {chosenSection && (
                        <div className="rounded-xl border-2 border-brand-200 bg-brand-50 p-5">
                            <p className="text-base font-semibold text-navy-900">
                                Who in {sectionLabel(chosenSection)} should
                                receive it?
                            </p>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {(options.addressees ?? []).map((who) => {
                                    const selected = data.addressee === who;

                                    return (
                                        <label
                                            key={who}
                                            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 bg-white px-4 py-3 transition ${
                                                selected
                                                    ? "border-brand-600"
                                                    : "border-line hover:border-brand-200"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="addressee"
                                                value={who}
                                                checked={selected}
                                                onChange={() =>
                                                    setData("addressee", who)
                                                }
                                                className="h-5 w-5 text-brand-600"
                                            />
                                            <span className="text-base font-medium text-navy-900">
                                                {who}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            {data.addressee && (
                                <p className="mt-4 text-base text-navy-800">
                                    Will be addressed to{" "}
                                    <span className="font-bold">
                                        {data.addressee},{" "}
                                        {sectionLabel(chosenSection)}
                                    </span>
                                </p>
                            )}

                            {errors.addressee && (
                                <p className="mt-2 text-sm font-medium text-stop-600">
                                    {errors.addressee}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="rounded-xl bg-paper px-4 py-3">
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
                            {processing ? "Registering..." : "Register arrival"}
                        </EmployeeButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
