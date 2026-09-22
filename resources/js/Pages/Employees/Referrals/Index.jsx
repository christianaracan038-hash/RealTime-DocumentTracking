import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import Icon from "@/Components/Employee/Icon";
import AgeBadge from "@/Components/Employee/AgeBadge";
import { useNotice } from "@/Components/Employee/Notice";

import ArrivalFormModal from "@/Components/Employee/Referrals/ArrivalFormModal";
import DetailsFormModal from "@/Components/Employee/Referrals/DetailsFormModal";
import ArrivalStubModal from "@/Components/Employee/Referrals/ArrivalStubModal";
import RecentReferralsTable from "@/Components/Employee/Referrals/RecentReferralsTable";
import {
    addressedTo,
    exactTime,
} from "@/Components/Employee/Referrals/referral";

/*
 * Referrals, registered in two steps.
 *
 * Step 1 - "Register arrival" - is done at the counter the moment a
 * document lands. It takes four fields, starts the clock, and produces
 * the QR, so the document can be forwarded the same morning. Its stub
 * is printed and attached straight away.
 *
 * Step 2 - "Complete details" - is done later, usually by someone else.
 * Everything still waiting for it is listed at the top of this page, so
 * nothing quietly sits half-finished.
 */
export default function Index({
    referrals = [],
    awaitingDetails = [],
    sections = [],
    referralOptions = {},
    fromSection = null,
    filters = {},
    openForm = false,
    stubDocument = null,
    canCompleteDetails = false,
}) {
    const [registering, setRegistering] = useState(openForm);
    const [completing, setCompleting] = useState(null);
    const [stubFor, setStubFor] = useState(stubDocument);

    const { flash } = usePage().props;
    const { notify } = useNotice();

    /*
     * Keyed on flash.id, which changes every time, so two registrations
     * in a row raise two notices.
     */
    useEffect(() => {
        if (!flash?.success) return;

        const subject = stubDocument ?? referrals?.data?.[0];

        notify({
            title: stubDocument
                ? "Arrival registered"
                : "Referral details completed",
            message: flash.success,
            details: subject
                ? [
                      ["Taxpayer", subject.taxpayer_name],
                      ["Reference no.", subject.tracking_number],
                  ]
                : [],
        });
    }, [flash?.id]);

    // A fresh arrival: offer its stub for printing straight away.
    useEffect(() => setStubFor(stubDocument), [stubDocument]);

    return (
        <EmployeeLayout title="Referrals">
            <div className="space-y-6">
                {/* Step 2's worklist, so nothing sits half-finished */}
                {awaitingDetails.length > 0 && (
                    <EmployeeCard className="border-2 border-accent-400">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-navy-900">
                                    Awaiting details
                                </h2>

                                <p className="mt-1 text-base text-muted">
                                    Registered at the counter. The concerns and
                                    remarks still need filling in.
                                </p>
                            </div>

                            <span className="rounded-full bg-accent-400 px-4 py-1.5 text-base font-bold text-navy-900">
                                {awaitingDetails.length} waiting
                            </span>
                        </div>

                        <ul className="space-y-3">
                            {awaitingDetails.map((document) => (
                                <li
                                    key={document.document_id}
                                    className="rounded-xl border border-line p-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-lg font-bold text-navy-900">
                                                {document.taxpayer_name ??
                                                    "No taxpayer on record"}
                                            </p>

                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                                                <span className="font-mono">
                                                    {document.tracking_number}
                                                </span>
                                                <span>
                                                    Registered{" "}
                                                    {exactTime(
                                                        document.created_at,
                                                    )}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-sm text-muted">
                                                To{" "}
                                                <span className="font-semibold text-navy-800">
                                                    {addressedTo(document) ||
                                                        "—"}
                                                </span>
                                            </p>

                                            <AgeBadge
                                                document={document}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <EmployeeButton
                                                variant="quiet"
                                                onClick={() =>
                                                    setStubFor(document)
                                                }
                                            >
                                                <Icon name="print" />
                                                Stub
                                            </EmployeeButton>

                                            {canCompleteDetails ? (
                                                <EmployeeButton
                                                    onClick={() =>
                                                        setCompleting(document)
                                                    }
                                                >
                                                    <Icon name="register" />
                                                    Complete details
                                                </EmployeeButton>
                                            ) : (
                                                <span className="self-center text-sm text-muted">
                                                    Awaiting details from RDO
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </EmployeeCard>
                )}

                <RecentReferralsTable
                    documents={referrals}
                    filters={filters}
                    only={["referrals", "filters"]}
                    heading="Recent registered referrals"
                    subheading="Referrals you registered, newest first."
                    onCompleteDetails={
                        canCompleteDetails ? setCompleting : null
                    }
                    action={
                        <EmployeeButton
                            size="lg"
                            onClick={() => setRegistering(true)}
                            className="w-full sm:w-auto"
                        >
                            <Icon name="add" />
                            Register arrival
                        </EmployeeButton>
                    }
                />
            </div>

            <ArrivalFormModal
                open={registering}
                onClose={() => setRegistering(false)}
                sections={sections}
                options={referralOptions}
                fromSection={fromSection}
            />

            <DetailsFormModal
                open={Boolean(completing)}
                onClose={() => setCompleting(null)}
                document={completing}
                sections={sections}
                options={referralOptions}
            />

            {stubFor && (
                <ArrivalStubModal
                    document={stubFor}
                    onClose={() => setStubFor(null)}
                />
            )}
        </EmployeeLayout>
    );
}
