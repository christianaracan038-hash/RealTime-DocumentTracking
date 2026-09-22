import { useEffect } from "react";
import { useForm } from "@inertiajs/react";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import ChoiceGroup from "@/Components/Employee/ChoiceGroup";
import DateField, { today } from "@/Components/Employee/DateField";
import { addressedTo, exactTime, sectionLabel } from "./referral";

/*
 * Step 2 - filling in a referral's details.
 *
 * Usually done by someone other than whoever registered the arrival,
 * often hours later. What step 1 already recorded is shown read-only at
 * the top, so the encoder can check the paper in their hand against the
 * right record before typing.
 *
 * A referral left bare by the earlier draft flow has no routing facts at
 * all; for those, this form asks for them too.
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

export default function DetailsFormModal({
    open,
    onClose,
    document = null,
    sections = [],
    options = {},
}) {
    // Anything step 1 did not record has to be asked for here.
    const needsRouting = Boolean(document) && !document.taxpayer_name;

    const { data, setData, patch, processing, errors, reset, clearErrors } =
        useForm({
            concerns: [],
            concern_other: "",
            referred_for: [],
            referred_for_other: "",
            remarks: "",
            remarks_other: "",

            taxpayer_name: "",
            document_date: today(),
            destination_section_id: "",
            addressee: "",
        });

    useEffect(() => {
        if (!open) return;

        const onKey = (e) => e.key === "Escape" && !processing && onClose();
        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [open, processing]);

    if (!open || !document) return null;

    const submit = (e) => {
        e.preventDefault();

        patch(route("documents.complete", document.document_id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                onClose();
            },
        });
    };

    const chosenSection = sections.find(
        (s) => String(s.section_id) === String(data.destination_section_id),
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/70 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-form-title"
        >
            <div className="w-full max-w-2xl rounded-2xl bg-white">
                <div className="flex items-start justify-between gap-4 border-b border-line px-7 py-5">
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                            Step 2 of 2
                        </p>

                        <h2
                            id="details-form-title"
                            className="mt-1 text-2xl font-bold text-navy-900"
                        >
                            Complete referral details
                        </h2>
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

                {/* What step 1 recorded - check the paper against this */}
                {!needsRouting && (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-b border-line bg-paper px-7 py-5 text-base">
                        <dt className="text-sm font-semibold text-muted">
                            Taxpayer
                        </dt>
                        <dd className="font-bold text-navy-900">
                            {document.taxpayer_name}
                        </dd>

                        <dt className="text-sm font-semibold text-muted">
                            Reference no.
                        </dt>
                        <dd className="font-mono text-navy-900">
                            {document.tracking_number}
                        </dd>

                        <dt className="text-sm font-semibold text-muted">To</dt>
                        <dd className="text-navy-900">
                            {addressedTo(document) || "—"}
                        </dd>

                        <dt className="text-sm font-semibold text-muted">
                            Registered
                        </dt>
                        <dd className="text-navy-900">
                            {exactTime(document.created_at)}
                        </dd>
                    </dl>
                )}

                <form onSubmit={submit} className="space-y-6 px-7 py-6">
                    {/*
                     * Only for referrals the old draft flow left bare.
                     */}
                    {needsRouting && (
                        <div className="space-y-6 rounded-xl border-2 border-accent-400 bg-accent-100 p-5">
                            <p className="text-base font-semibold text-navy-900">
                                This referral has no details at all yet, so it
                                needs the arrival information too.
                            </p>

                            <Field
                                label="Taxpayer's Name"
                                error={errors.taxpayer_name}
                            >
                                <input
                                    type="text"
                                    value={data.taxpayer_name}
                                    onChange={(e) =>
                                        setData("taxpayer_name", e.target.value)
                                    }
                                    className={FIELD}
                                />
                            </Field>

                            <Field
                                label="Date Issued"
                                error={errors.document_date}
                            >
                                <DateField
                                    value={data.document_date}
                                    onChange={(v) =>
                                        setData("document_date", v)
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
                                        <option
                                            key={s.section_id}
                                            value={s.section_id}
                                        >
                                            {sectionLabel(s)}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            {chosenSection && (
                                <Field
                                    label="Addressed to"
                                    error={errors.addressee}
                                >
                                    <ChoiceGroup
                                        name="addressee"
                                        options={options.addressees ?? []}
                                        value={data.addressee}
                                        onChange={(v) =>
                                            setData("addressee", v)
                                        }
                                    />
                                </Field>
                            )}
                        </div>
                    )}

                    <Field
                        label="Concerns"
                        hint="Tick all that apply."
                        error={errors.concerns}
                    >
                        <ChoiceGroup
                            name="concerns"
                            multiple
                            options={options.concerns ?? []}
                            value={data.concerns}
                            onChange={(v) => setData("concerns", v)}
                            otherValue={data.concern_other}
                            onOtherChange={(v) => setData("concern_other", v)}
                            otherPlaceholder="What is the other concern?"
                            otherError={errors.concern_other}
                        />
                    </Field>

                    <Field
                        label="For"
                        hint="Action requested of the receiving office. Tick all that apply."
                        error={errors.referred_for}
                    >
                        <ChoiceGroup
                            name="referred_for"
                            multiple
                            options={options.referred_for ?? []}
                            value={data.referred_for}
                            onChange={(v) => setData("referred_for", v)}
                            otherValue={data.referred_for_other}
                            onOtherChange={(v) =>
                                setData("referred_for_other", v)
                            }
                            otherPlaceholder="What is the other action?"
                            otherError={errors.referred_for_other}
                        />
                    </Field>

                    <Field
                        label="Remarks"
                        hint="Where the document stands right now."
                        error={errors.remarks}
                    >
                        <ChoiceGroup
                            name="remarks"
                            options={options.remarks ?? []}
                            value={data.remarks}
                            onChange={(v) => setData("remarks", v)}
                            otherValue={data.remarks_other}
                            onOtherChange={(v) => setData("remarks_other", v)}
                            otherPlaceholder="Describe the status"
                            otherError={errors.remarks_other}
                        />
                    </Field>

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
                            <Icon name="complete" />
                            {processing ? "Saving..." : "Save details"}
                        </EmployeeButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
