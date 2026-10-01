import { useForm } from "@inertiajs/react";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import Icon from "@/Components/Employee/Icon";
import { longDate, sectionLabel } from "./referral";

/*
 * Registering a section's own referral - everything except the RDO.
 *
 * Two things are asked for and three are not. Where it goes, and what it
 * is about; the section preparing it is whoever is signed in, the date
 * and time are stamped on saving, and it is addressed to the Chief like
 * everything else. Asking for any of the three would only let somebody
 * answer wrong.
 *
 * No taxpayer either. This is an internal docket rather than a
 * taxpayer's referral, and the paper it produces is an accountability
 * slip with two signature blocks - see SectionSlipModal.
 */

const FIELD =
    "min-h-12 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-navy-900 placeholder:text-muted focus:border-brand-600";

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

/** A value the system fills in, shown so nobody wonders what it will be. */
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
    onCancel = null,
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        destination_section_id: "",
        concern: "",
    });

    const submit = (event) => {
        event.preventDefault();

        post(route("referrals.section.store"), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <EmployeeCard>
            <div className="mx-auto max-w-xl">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-2xl font-bold tracking-wide text-navy-900 uppercase">
                        Registration
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
                        value={longDate(new Date())}
                    />

                    <Field
                        label="Receiving Section"
                        error={errors.destination_section_id}
                    >
                        <select
                            value={data.destination_section_id}
                            onChange={(e) =>
                                setData(
                                    "destination_section_id",
                                    e.target.value,
                                )
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
                                Back to referrals
                            </EmployeeButton>
                        )}

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
        </EmployeeCard>
    );
}
