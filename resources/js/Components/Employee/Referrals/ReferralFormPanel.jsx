import { useForm } from "@inertiajs/react";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import Icon from "@/Components/Employee/Icon";
import { longDate, sectionLabel } from "./referral";

/*
 * Registering a referral, complete, in one frame.
 *
 * No "Step 1 of 2" here, and no passing through a shorter form first.
 * The two-step split earns its keep at the counter, where a taxpayer is
 * standing there and a name and a date are all anybody has time to take;
 * at a desk with the document in hand it only means filling one form to
 * unlock another.
 *
 * Laid out in the order of the paper it replaces (BIR Form 2309): who it
 * concerns, where it goes, what it is about.
 */

const FIELD =
    "min-h-12 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-navy-900 placeholder:text-muted focus:border-brand-600";

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
    onRegistered = () => {},
    onCancel = null,
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        taxpayer_name: "",
        destination_section_id: "",
        concern: "",
    });

    const submit = (event) => {
        event.preventDefault();

        post(route("referrals.store"), {
            preserveScroll: true,
            onSuccess: () => {
                reset();

                onRegistered();
            },
        });
    };

    return (
        <EmployeeCard>
            <div className="mx-auto max-w-2xl">
                <h2 className="text-2xl font-bold text-navy-900">
                    Register a referral
                </h2>

                <p className="mt-1 text-base text-muted">
                    Everything at once. Saving starts the clock, creates the
                    reference number, and produces a slip you can print
                    immediately.
                </p>

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
                    </div>

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
                            disabled={processing}
                        >
                            <Icon name="register" />
                            {processing
                                ? "Registering..."
                                : "Register referral"}
                        </EmployeeButton>
                    </div>
                </form>
            </div>
        </EmployeeCard>
    );
}
