import { useState } from "react";
import { usePage } from "@inertiajs/react";

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

            {flash?.success && (
                <p
                    role="status"
                    className="mb-6 rounded-xl bg-ok-100 px-5 py-3.5 text-base font-semibold text-ok-600"
                >
                    {flash.success}
                </p>
            )}

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
