import { useForm } from "@inertiajs/react";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import Icon from "@/Components/Employee/Icon";
import { longDate, sectionLabel } from "./referral";

const FIELD =
    "min-h-12 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-navy-900 placeholder:text-muted focus:border-brand-600";

const ADMIN_ACTIONS = ["Chief", "Archive"];

function Field({ label, error, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-base font-semibold text-navy-800">
                {label}
            </label>

            {children}

            {error && (
                <p className="mt-2 text-base font-medium text-stop-600">
                    {error}
                </p>
            )}
        </div>
    );
}

function Stamped({ label, value }) {
    return (
        <div>
            <p className="mb-1.5 text-base font-semibold text-navy-800">
                {label}
            </p>

            <div className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-sunken px-4 py-3">
                <span className="flex-1 text-base font-semibold text-navy-900">
                    {value}
                </span>

                <span className="text-sm text-muted">Set automatically</span>
            </div>
        </div>
    );
}

export default function SectionReferralPanel({
    sections = [],
    fromSection = null,
    referral = null,
    onCancel = null,
    canDirectSend = false,
}) {
    const editing = Boolean(referral);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        destination_section_id: referral?.destination_section_id ?? "",
        concern: referral?.concern ?? "",
        addressee: "",
        archive: false,
    });

    const selectedSection = sections.find(
        (s) => String(s.section_id) === String(data.destination_section_id),
    );

    const isAdminDestination =
        selectedSection?.section_code?.toUpperCase() === "ADMIN" ||
        selectedSection?.section_name?.toUpperCase() === "ADMIN";

    const isOnett = fromSection?.section_name?.toUpperCase() === "ONETT";

    const showAdminActions =
        (canDirectSend || isOnett) && !editing && isAdminDestination;
    const isArchiving = showAdminActions && data.archive;

    const handleSectionChange = (value) => {
        setData((current) => ({
            ...current,
            destination_section_id: value,
            addressee: "",
            archive: false,
        }));
    };

    const handleAdminAction = (option) => {
        setData((current) => ({
            ...current,
            addressee: option,
            archive: option === "Archive",
        }));
    };

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                if (editing) onCancel?.();
                else reset();
            },
        };

        if (editing) {
            put(
                route("referrals.section.update", referral.document_id),
                options,
            );
        } else {
            post(route("referrals.section.store"), options);
        }
    };

    return (
        <EmployeeCard>
            <div className="mx-auto max-w-xl">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-2xl font-bold tracking-wide text-navy-900 uppercase">
                        {editing ? "Edit Referral" : "Registration"}
                    </h2>

                    <p className="shrink-0 pt-1 text-xs font-semibold tracking-widest text-muted uppercase">
                        Reference Slip
                    </p>
                </div>

                <form onSubmit={submit} className="mt-6 space-y-6">
                    <Stamped
                        label="Section Prepared"
                        value={fromSection ? sectionLabel(fromSection) : "—"}
                    />

                    <Stamped
                        label="Date and Time"
                        value={longDate(
                            editing ? referral.created_at : new Date(),
                        )}
                    />

                    <Field
                        label="Receiving Section"
                        error={errors.destination_section_id}
                    >
                        <select
                            value={data.destination_section_id}
                            onChange={(e) =>
                                handleSectionChange(e.target.value)
                            }
                            className={FIELD}
                        >
                            <option value="">Select</option>

                            {sections.map((section) => (
                                <option
                                    key={section.section_id}
                                    value={section.section_id}
                                >
                                    {sectionLabel(section)}
                                </option>
                            ))}
                        </select>
                    </Field>

                    {showAdminActions && (
                        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                            <p className="text-base font-semibold text-slate-800">
                                Forward to Admin for
                            </p>

                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {ADMIN_ACTIONS.map((option) => {
                                    const selected = data.addressee === option;

                                    return (
                                        <label
                                            key={option}
                                            className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border-2 bg-white px-3 py-2 text-base font-medium transition ${
                                                selected
                                                    ? "border-blue-600 text-blue-700"
                                                    : "border-slate-200 text-slate-700 hover:border-blue-200"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="admin-action"
                                                value={option}
                                                checked={selected}
                                                onChange={() =>
                                                    handleAdminAction(option)
                                                }
                                                className="h-4 w-4 text-blue-600"
                                            />
                                            {option}
                                        </label>
                                    );
                                })}
                            </div>

                            {errors.addressee && (
                                <p className="mt-2 text-base font-medium text-stop-600">
                                    {errors.addressee}
                                </p>
                            )}

                            {isArchiving && (
                                <p className="mt-3 text-sm text-amber-700">
                                    Admin has to receive this document first. It
                                    will be archived as soon as Admin receives
                                    it, and you will be recorded as the one who
                                    forwarded it for archiving.
                                </p>
                            )}
                        </div>
                    )}

                    <Field label="Description" error={errors.concern}>
                        <textarea
                            rows="4"
                            value={data.concern}
                            onChange={(e) => setData("concern", e.target.value)}
                            placeholder="Details"
                            className={`${FIELD} resize-none`}
                        />
                    </Field>

                    <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
                        {onCancel && (
                            <EmployeeButton
                                type="button"
                                variant="quiet"
                                onClick={onCancel}
                                disabled={processing}
                            >
                                Back to Referrals
                            </EmployeeButton>
                        )}

                        <EmployeeButton
                            type="submit"
                            size="lg"
                            disabled={
                                processing ||
                                (showAdminActions && !data.addressee)
                            }
                        >
                            <Icon name="register" />
                            {processing
                                ? "Saving..."
                                : editing
                                  ? "Save changes"
                                  : isArchiving
                                    ? "Register for Archiving"
                                    : "Register"}
                        </EmployeeButton>
                    </div>
                </form>
            </div>
        </EmployeeCard>
    );
}
