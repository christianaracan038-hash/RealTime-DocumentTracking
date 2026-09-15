import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";

import { useNotice } from "@/Components/Employee/Notice";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import EmployeePageHeader from "@/Components/Employee/EmployeePageHeader";
import EmployeeButton from "@/Components/Employee/EmployeeButton";

import ReferralFormModal from "@/Components/Employee/Referrals/ReferralFormModal";
import RecentReferralsTable from "@/Components/Employee/Referrals/RecentReferralsTable";

export default function Create({
    documents = [],
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
     * Turn it into the formal notice, with the newest referral's details.
     */
    useEffect(() => {
        if (!flash?.success) return;

        const latest = documents?.data?.[0];

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
        <EmployeeLayout title="Referral registration">
            <EmployeePageHeader
                title="Referral registration"
                subtitle="Register a referral (BIR Form 2309), then print its reference slip and attach it to the document."
                action={
                    <EmployeeButton
                        size="lg"
                        onClick={() => setRegistering(true)}
                    >
                        + New referral
                    </EmployeeButton>
                }
            />

            <RecentReferralsTable documents={documents} filters={filters} />

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
