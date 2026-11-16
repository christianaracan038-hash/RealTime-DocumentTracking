import { useForm } from "@inertiajs/react";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import Icon from "@/Components/Employee/Icon";
import { longDate, sectionLabel } from "./referral";

const FIELD =
    "min-h-12 w-full rounded-xl border border-line bg-white px-4 py-3 text-base font-semibold text-navy-900 placeholder:text-muted focus:border-navy-800 focus:outline-none";
function Field({ label, hint, error, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-base font-semibold text-navy-800">
                {label}
            </label>

            {hint && !error && (
                <p className="mb-2 text-sm text-muted">{hint}</p>
            )}

            {children}

            {error && (
                <p className="mt-2 text-base font-medium text-stop-600">
                    {error}
                </p>
            )}
        </div>
    );
}

export default function ReferralFormPanel({
    sections = [],
    options = {},
    fromSection = null,
    referral = null,
    onRegistered = () => {},
    onCancel = null,
}) {
    const isEditing = Boolean(referral);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        taxpayer_name: referral?.taxpayer_name ?? "",
        destination_section_id: referral?.destination_section_id ?? "",
        concern: referral?.concern ?? "",
        addressee: referral?.addressee ?? "",
        archive: false,
    });

    const selectedSection = sections.find(
        (s) => String(s.section_id) === String(data.destination_section_id),
    );

    const isAdminDestination =
        selectedSection?.section_code?.toUpperCase() === "ADMIN" ||
        selectedSection?.section_name?.toUpperCase() === "ADMIN";
    const showAdminActions = !isEditing && isAdminDestination;
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
                if (!isEditing) reset();
                onRegistered();
            },
        };

        if (isEditing) {
            put(route("referrals.update", referral.document_id), options);
        } else {
            post(route("referrals.store"), options);
        }
    };

    return (
        <EmployeeCard>
            <div className="mx-auto max-w-2xl">
                <h2 className="text-2xl font-bold text-navy-900">
                    {isEditing ? "Edit Referral" : "Register a Referral"}
                </h2>

                <form onSubmit={submit} className="mt-6 space-y-6">
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
                     * Shown, not asked for - the server stamps it on
                     * save. Registering in one pass must not be a way
                     * round the rule that step 1 obeys.
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

                    <div className="border-t border-line pt-6">
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
                    </div>

                    {showAdminActions && (
                        <div className="mt-4 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                            <p className="text-base font-semibold text-slate-800">
                                Forward to Admin for
                            </p>

                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {["Chief", "Archive"].map((option) => {
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
                                                name="admin-action-rdo"
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

                    <div className="border-t border-line pt-6">
                        <Field label="Details" error={errors.concern}>
                            <textarea
                                rows="4"
                                value={data.concern}
                                onChange={(e) =>
                                    setData("concern", e.target.value)
                                }
                                placeholder="Details"
                                className={`${FIELD} resize-none`}
                            />
                        </Field>
                    </div>

                    {/*
                     * No addressee, no "For", no "Remarks". Everything is
                     * addressed to the Chief - and if the Chief is away,
                     * whoever receives it does so on their own account,
                     * which the movement trail records. The other two are
                     * blocks the RDO or a Chief fills in by hand on the
                     * hardcopy, so the slip prints them empty.
                     */}

                    <div className="rounded-xl bg-sunken px-4 py-3">
                        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                            From
                        </p>

                        <p className="mt-0.5 text-base font-semibold text-navy-900">
                            {fromSection ? sectionLabel(fromSection) : "—"}
                        </p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
                        {onCancel && (
                            <EmployeeButton
                                type="button"
                                variant="quiet"
                                onClick={onCancel}
                                disabled={processing}
                            >
                                Back to referrals
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
                                ? isEditing
                                    ? "Saving..."
                                    : "Registering..."
                                : isEditing
                                  ? "Save changes"
                                  : "Register referral"}
                        </EmployeeButton>
                    </div>
                </form>
            </div>
        </EmployeeCard>
    );
}
