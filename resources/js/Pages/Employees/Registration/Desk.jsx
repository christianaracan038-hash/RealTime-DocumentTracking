import { useEffect, useState } from "react";
import { router, usePage } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import SearchInput from "@/Components/Employee/SearchInput";
import { useNotice } from "@/Components/Employee/Notice";
import ArrivalFormModal from "@/Components/Employee/Referrals/ArrivalFormModal";
import { exactTime } from "@/Components/Employee/Referrals/referral";

/*
 * The registration desk - the whole of step 1.
 *
 * One button and one list, because this screen is used with a taxpayer
 * standing at the counter. Register the arrival, see it appear at the top
 * of the day's list, move on to the next person.
 *
 * No receiving section, no concerns, no queue of other people's work:
 * all of that is step 2, on the Referrals page, done by the other
 * account once the document can actually be read.
 */
export default function Desk({
    registered,
    fromSection = null,
    filters = {},
    openForm = false,
}) {
    const [registering, setRegistering] = useState(openForm);

    const { flash } = usePage().props;
    const { notify } = useNotice();

    const rows = registered?.data ?? [];

    /*
     * Keyed on flash.id, which changes every time, so registering two
     * taxpayers in a row raises two notices. The newest row is the one
     * just saved.
     */
    useEffect(() => {
        if (!flash?.success) return;

        const just = registered?.data?.[0];

        notify({
            title: "Arrival registered",
            message: flash.success,
            details: just
                ? [
                      ["Taxpayer", just.taxpayer_name],
                      ["Reference no.", just.tracking_number],
                      ["Registered", exactTime(just.created_at)],
                  ]
                : [],
        });
    }, [flash?.id]);

    const goToPage = (url) => {
        if (!url) return;

        router.visit(url, { preserveState: true, preserveScroll: true });
    };

    return (
        <EmployeeLayout title="Register a referral">
            <div className="space-y-6">
                {/*
                 * The one action on this screen, so it is the size of
                 * the card rather than a button in a corner.
                 */}
                <EmployeeCard className="border-2 border-brand-200 bg-brand-50">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-navy-900">
                                A document has just arrived
                            </h2>

                            <p className="mt-1 text-base text-navy-800">
                                Take the taxpayer's name and the date on the
                                paper. That starts the clock and gives it a
                                reference number.
                            </p>
                        </div>

                        <EmployeeButton
                            size="lg"
                            onClick={() => setRegistering(true)}
                            className="w-full shrink-0 sm:w-auto"
                        >
                            <Icon name="add" />
                            Register a referral
                        </EmployeeButton>
                    </div>
                </EmployeeCard>

                <EmployeeCard>
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-navy-900">
                                Registered by you
                            </h2>

                            <p className="mt-1 text-base text-muted">
                                Newest first. The details are filled in
                                afterwards, so these will show as waiting until
                                someone completes them.
                            </p>
                        </div>

                        <div className="w-full lg:w-80">
                            <SearchInput
                                label="Find a registration"
                                initialValue={filters.search}
                                placeholder="Taxpayer or reference no..."
                                only={["registered", "filters"]}
                            />
                        </div>
                    </div>

                    {rows.length > 0 ? (
                        <ul className="divide-y divide-line rounded-xl border border-line">
                            {rows.map((document) => (
                                <li
                                    key={document.document_id}
                                    className="flex flex-wrap items-center gap-4 px-4 py-4"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                                        <Icon name="register" />
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-lg font-bold text-navy-900">
                                            {document.taxpayer_name ??
                                                "No taxpayer on record"}
                                        </p>

                                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-base text-muted">
                                            <span className="font-mono text-sm">
                                                {document.tracking_number}
                                            </span>

                                            <span>
                                                {exactTime(document.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {document.details_completed_at ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-100 px-3 py-1 text-sm font-bold text-ok-600">
                                            <Icon name="check" />
                                            Details done
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-accent-100 px-3 py-1 text-sm font-bold text-navy-900">
                                            Awaiting details
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="rounded-xl border border-dashed border-line py-14 text-center">
                            <p className="text-lg font-semibold text-navy-800">
                                {filters.search
                                    ? "Nothing matches that search"
                                    : "Nothing registered yet"}
                            </p>

                            <p className="mt-1 text-base text-muted">
                                {filters.search
                                    ? "Try the taxpayer's name or the reference number."
                                    : "Press Register a referral when the first document arrives."}
                            </p>
                        </div>
                    )}

                    {registered?.links?.length > 3 && (
                        <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-base text-muted">
                                Showing{" "}
                                <span className="font-semibold text-navy-900">
                                    {registered.from ?? 0}–{registered.to ?? 0}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-navy-900">
                                    {registered.total ?? 0}
                                </span>
                            </p>

                            <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                                {registered.links.map((link, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        disabled={!link.url}
                                        onClick={() => goToPage(link.url)}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                        className={`min-h-11 rounded-xl border px-4 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                            link.active
                                                ? "border-brand-600 bg-brand-600 text-white"
                                                : "border-line bg-white text-navy-800 hover:bg-paper"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </EmployeeCard>
            </div>

            <ArrivalFormModal
                open={registering}
                onClose={() => setRegistering(false)}
                fromSection={fromSection}
            />
        </EmployeeLayout>
    );
}
