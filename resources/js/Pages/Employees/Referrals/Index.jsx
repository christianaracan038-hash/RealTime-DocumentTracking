import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import { useNotice } from "@/Components/Employee/Notice";

import ReferralFormModal from "@/Components/Employee/Referrals/ReferralFormModal";
import RecentReferralsTable from "@/Components/Employee/Referrals/RecentReferralsTable";

/*
 * Referrals registered by this employee, on their own screen away from
 * the receiving queue.
 *
 * Arrived at from the dashboard's "New referral" button, which passes
 * ?new=1 so the form opens straight away. Cancelling the form leaves
 * the clerk here looking at the list; saving brings them back to it
 * with the new referral at the top, ready to add another.
 */
export default function Index({
    referrals = [],
    sections = [],
    referralOptions = {},
    fromSection = null,
    filters = {},
    openForm = false,
}) {
    const [registering, setRegistering] = useState(openForm);

    const { flash } = usePage().props;
    const { notify } = useNotice();

    /*
     * Keyed on flash.id, which changes every time, so registering two
     * referrals in a row raises two notices.
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
        <EmployeeLayout title="Referrals">
            <RecentReferralsTable
                documents={referrals}
                filters={filters}
                only={["referrals", "filters"]}
                heading="Recent registered referrals"
                subheading="Referrals you registered, newest first."
                action={
                    <EmployeeButton
                        size="lg"
                        onClick={() => setRegistering(true)}
                        className="w-full sm:w-auto"
                    >
                        <Icon name="add" />
                        Add another referral
                    </EmployeeButton>
                }
            />

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
