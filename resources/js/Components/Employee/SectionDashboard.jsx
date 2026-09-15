import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import { useNotice } from "@/Components/Employee/Notice";

import IncomingDocuments from "@/Pages/Employees/Documents/IncomingDocuments";
import ReferralFormModal from "@/Components/Employee/Referrals/ReferralFormModal";
import RecentReferralsTable from "@/Components/Employee/Referrals/RecentReferralsTable";

/*
 * The body of every section dashboard.
 *
 * One screen covering both halves of the day: what has been sent to us
 * and needs receiving, and what we have sent out. Registering a referral
 * opens a dialog from here, so there is no separate page to find.
 *
 * Each section's page file passes its own wording and renders this.
 */
export default function SectionDashboard({
    title,
    eyebrow,
    blurb,
    documents = [],
    referrals = [],
    sections = [],
    referralOptions = {},
    fromSection = null,
    filters = {},
}) {
    const [registering, setRegistering] = useState(false);

    const { flash } = usePage().props;
    const { notify } = useNotice();

    /*
     * The server flashes a success message after a referral is saved.
     * Turn it into the formal notice, with the new referral's details.
     * Keyed on flash.id, which changes each time, so registering two in
     * a row raises two notices.
     */
    useEffect(() => {
        if (!flash?.success) return;

        const latest = referrals?.data?.[0];

        notify({
            title: "Referral registered",
            message: flash.success,
            details: latest
                ? [
                      ["Taxpayer", latest.taxpayer_name],
                      ["Reference no.", latest.tracking_number],
                  ]
                : [],
        });
    }, [flash?.id]);

    return (
        <EmployeeLayout title={title}>
            <div className="space-y-6">
                {/* Who you are, and the one thing you can start here */}
                <div className="rounded-2xl bg-navy-900 p-6 sm:p-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold tracking-widest text-accent-400 uppercase">
                                {eyebrow}
                            </p>

                            <h2 className="mt-2 text-2xl font-bold text-white">
                                Documents on your desk
                            </h2>

                            <p className="mt-2 max-w-2xl text-base text-navy-200">
                                {blurb}
                            </p>
                        </div>

                        <EmployeeButton
                            size="lg"
                            onClick={() => setRegistering(true)}
                            className="w-full shrink-0 lg:w-auto"
                        >
                            + New referral
                        </EmployeeButton>
                    </div>
                </div>

                <IncomingDocuments documents={documents} />

                <RecentReferralsTable
                    documents={referrals}
                    filters={filters}
                    only={["referrals", "filters"]}
                />
            </div>

            <ReferralFormModal
                open={registering}
                onClose={() => setRegistering(false)}
                sections={sections}
                options={referralOptions}
                fromSection={fromSection}
            />
        </EmployeeLayout>
    );
}
