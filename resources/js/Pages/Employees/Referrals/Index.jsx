import { useEffect, useState } from "react";
import { router, usePage } from "@inertiajs/react";

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
 *
 * Registration is now two steps:
 * 1. "Generate QR" posts to documents.quick-create, which creates a
 *    draft document (tracking number + QR, timestamped right then)
 *    and redirects back here with ?new=1&draft={id}.
 * 2. The form opens already bound to that draft (draftDocument), and
 *    completing it PATCHes documents.complete for that same document
 *    instead of creating a new one. This step can also be reopened
 *    later — for any draft still sitting in the list — by clicking
 *    "Complete referral" on its row, not only right after Step 1.
 *
 * Only employees in an RDO section may complete a draft (canCompleteDrafts,
 * computed server-side from config('referral.draft_completion_sections')).
 * Everyone else sees "Awaiting RDO" instead of the action.
 */
export default function Index({
    referrals = [],
    sections = [],
    referralOptions = {},
    fromSection = null,
    filters = {},
    openForm = false,
    draftDocument = null,
    canCompleteDrafts = false,
}) {
    const [registering, setRegistering] = useState(openForm);
    const [generatingQr, setGeneratingQr] = useState(false);

    /*
     * The draft currently open in the form. Starts as whatever the
     * server sent (a fresh Step 1 redirect); can also be set later by
     * clicking "Complete referral" on any draft row in the table —
     * including one generated earlier, by this employee or another
     * in the same RDO section.
     */
    const [activeDraft, setActiveDraft] = useState(draftDocument);

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

    /*
     * A fresh draft arrived from Step 1 (quick-create redirected back
     * here with ?new=1&draft={id}). Open the form on it.
     */
    useEffect(() => {
        if (openForm && draftDocument) {
            setActiveDraft(draftDocument);
            setRegistering(true);
        }
    }, [openForm, draftDocument]);

    const completeDraft = (document) => {
        setActiveDraft(document);
        setRegistering(true);
    };

    const closeForm = () => {
        setRegistering(false);
        setActiveDraft(null);
    };

    const generateQr = () => {
        setGeneratingQr(true);

        router.post(
            route("documents.quick-create"),
            {},
            {
                preserveScroll: true,
                onFinish: () => setGeneratingQr(false),
            },
        );
    };

    return (
        <EmployeeLayout title="Referrals">
            <RecentReferralsTable
                documents={referrals}
                filters={filters}
                only={["referrals", "filters"]}
                heading="Recent registered referrals"
                subheading="Referrals you registered, newest first."
                onCompleteDraft={canCompleteDrafts ? completeDraft : null}
                action={
                    <EmployeeButton
                        size="lg"
                        onClick={generateQr}
                        disabled={generatingQr}
                        className="w-full sm:w-auto"
                    >
                        <Icon name="add" />
                        {generatingQr ? "Generating..." : "Generate QR"}
                    </EmployeeButton>
                }
            />

            <ReferralFormModal
                open={registering}
                onClose={closeForm}
                sections={sections}
                options={referralOptions}
                fromSection={fromSection}
                document={activeDraft}
            />
        </EmployeeLayout>
    );
}
