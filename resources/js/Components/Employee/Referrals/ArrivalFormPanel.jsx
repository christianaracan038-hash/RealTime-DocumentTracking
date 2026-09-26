import { useForm } from "@inertiajs/react";

import EmployeeButton from "@/Components/Employee/EmployeeButton";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import Icon from "@/Components/Employee/Icon";
import DateField, { today } from "@/Components/Employee/DateField";
import { sectionLabel } from "./referral";

/*
 * Step 1, as its own frame rather than a dialog over the table.
 *
 * A modal is right for something you do to a row you are looking at.
 * Registering an arrival is not that: it is a different job, done while a
 * taxpayer stands at the counter, and it should have the screen to itself
 * instead of covering up the register behind it.
 *
 * Two fields, both readable off the paper at a glance. Where the document
 * goes is step 2's decision - see DetailsFormModal.
 */

const FIELD =
    "min-h-13 w-full rounded-xl border border-line bg-white px-4 py-3 text-lg text-navy-900 placeholder:text-muted focus:border-brand-600";

export default function ArrivalFormPanel({
    fromSection = null,
    onRegistered = () => {},
    onCancel = null,
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        document_date: today(),
        taxpayer_name: "",
    });

    const submit = (event) => {
        event.preventDefault();

        post(route("documents.store"), {
            preserveScroll: true,
            onSuccess: () => {
                reset();

                onRegistered();
            },
        });
    };

    return (
        <EmployeeCard>
            <div className="mx-auto max-w-xl">
                <p className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                    Step 1 of 2
                </p>

                <h2 className="mt-1 text-2xl font-bold text-navy-900">
                    Register an arrival
                </h2>

                <p className="mt-1 text-base text-muted">
                    Two things, while the taxpayer is still at the counter.
                    Saving starts the clock and creates the reference number.
                </p>

                <form onSubmit={submit} className="mt-6 space-y-6">
                    <div>
                        <label
                            htmlFor="taxpayer_name"
                            className="mb-1.5 block text-base font-semibold text-navy-800"
                        >
                            Taxpayer&apos;s Name
                        </label>

                        <input
                            id="taxpayer_name"
                            type="text"
                            value={data.taxpayer_name}
                            onChange={(e) =>
                                setData("taxpayer_name", e.target.value)
                            }
                            placeholder="e.g. Juan Dela Cruz"
                            autoFocus
                            className={FIELD}
                        />

                        {errors.taxpayer_name && (
                            <p className="mt-2 text-base font-medium text-stop-600">
                                {errors.taxpayer_name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="document_date"
                            className="mb-1.5 block text-base font-semibold text-navy-800"
                        >
                            Date Issued
                        </label>

                        <DateField
                            id="document_date"
                            value={data.document_date}
                            onChange={(value) =>
                                setData("document_date", value)
                            }
                        />

                        {errors.document_date && (
                            <p className="mt-2 text-base font-medium text-stop-600">
                                {errors.document_date}
                            </p>
                        )}
                    </div>

                    <div className="rounded-xl bg-paper px-4 py-3">
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
                            {processing ? "Registering..." : "Register arrival"}
                        </EmployeeButton>
                    </div>
                </form>
            </div>
        </EmployeeCard>
    );
}
