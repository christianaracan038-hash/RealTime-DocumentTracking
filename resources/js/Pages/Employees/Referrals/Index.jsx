import { useEffect, useState } from "react";
import { router, usePage } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import Icon from "@/Components/Employee/Icon";
import AgeBadge from "@/Components/Employee/AgeBadge";
import SearchInput from "@/Components/Employee/SearchInput";
import { useNotice } from "@/Components/Employee/Notice";
import { urgencyOf } from "@/Components/Employee/urgency";

import ArrivalFormModal from "@/Components/Employee/Referrals/ArrivalFormModal";
import DetailsFormModal from "@/Components/Employee/Referrals/DetailsFormModal";
import DocumentTrailModal from "@/Components/Employee/Referrals/DocumentTrailModal";
import { exactTime } from "@/Components/Employee/Referrals/referral";

/*
 * Step 2 - the referrals still waiting to be completed.
 *
 * This page holds unfinished work and nothing else. The counter
 * registers a taxpayer and a date, which starts the clock; until someone
 * here says where the document is going and what it is about, it cannot
 * move. Everything already completed is in History.
 *
 * Oldest first, because the one that has been waiting longest is the one
 * holding up a taxpayer.
 */
export default function Index({
    awaitingDetails,
    sections = [],
    referralOptions = {},
    fromSection = null,
    filters = {},
    openForm = false,
    canCompleteDetails = false,
}) {
    const [registering, setRegistering] = useState(openForm);
    const [completing, setCompleting] = useState(null);

    /*
     * The referral just finished. Opening it offers its reference slip,
     * which is what puts the QR on the physical document.
     */
    const [justCompleted, setJustCompleted] = useState(null);

    const { flash } = usePage().props;
    const { notify } = useNotice();

    const rows = awaitingDetails?.data ?? [];

    const waiting = awaitingDetails?.total ?? rows.length;

    useEffect(() => {
        if (!flash?.success) return;

        notify({ title: "Done", message: flash.success });
    }, [flash?.id]);

    const goToPage = (url) => {
        if (!url) return;

        router.visit(url, { preserveState: true, preserveScroll: true });
    };

    return (
        <EmployeeLayout title="Referrals">
            <EmployeeCard>
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-bold text-navy-900">
                                Waiting for their details
                            </h2>

                            {waiting > 0 && (
                                <span className="rounded-full bg-accent-400 px-4 py-1.5 text-base font-bold text-navy-900">
                                    {waiting}
                                </span>
                            )}
                        </div>

                        <p className="mt-1 text-base text-muted">
                            Registered at the counter. Each one needs its
                            receiving section, concerns and remarks before it
                            can be forwarded.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
                        <div className="w-full sm:w-72">
                            <SearchInput
                                label="Find a referral"
                                initialValue={filters.search}
                                placeholder="Taxpayer or reference no..."
                                only={["awaitingDetails", "filters"]}
                            />
                        </div>

                        <EmployeeButton
                            variant="quiet"
                            onClick={() => setRegistering(true)}
                            className="w-full shrink-0 sm:w-auto"
                        >
                            <Icon name="add" />
                            Register arrival
                        </EmployeeButton>
                    </div>
                </div>

                {rows.length > 0 ? (
                    <ul className="space-y-3">
                        {rows.map((document) => {
                            const urgency = urgencyOf(document);

                            return (
                                <li
                                    key={document.document_id}
                                    className={`flex overflow-hidden rounded-xl border ${
                                        document.aging?.overdue
                                            ? "border-stop-600"
                                            : "border-line"
                                    } ${urgency?.card ?? "bg-white"}`}
                                >
                                    {/* The wait reads before any text does */}
                                    <span
                                        aria-hidden="true"
                                        className={`w-1.5 shrink-0 ${
                                            urgency?.spine ?? "bg-navy-200"
                                        }`}
                                    />

                                    <div className="min-w-0 flex-1 p-5">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-lg font-bold text-navy-900">
                                                    {document.taxpayer_name ??
                                                        "No taxpayer on record"}
                                                </p>

                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                                                    <span className="font-mono">
                                                        {
                                                            document.tracking_number
                                                        }
                                                    </span>

                                                    <span>
                                                        Registered{" "}
                                                        {exactTime(
                                                            document.created_at,
                                                        )}
                                                    </span>
                                                </div>

                                                <AgeBadge
                                                    document={document}
                                                    className="mt-2"
                                                />
                                            </div>

                                            {canCompleteDetails ? (
                                                <EmployeeButton
                                                    onClick={() =>
                                                        setCompleting(document)
                                                    }
                                                    className="shrink-0"
                                                >
                                                    <Icon name="register" />
                                                    Complete details
                                                </EmployeeButton>
                                            ) : (
                                                <span className="shrink-0 self-center text-sm text-muted">
                                                    Awaiting details from the
                                                    RDO
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="rounded-xl border border-dashed border-line py-14 text-center">
                        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-ok-100 text-2xl text-ok-600">
                            <Icon name="check" />
                        </span>

                        <p className="text-lg font-semibold text-navy-800">
                            {filters.search
                                ? "Nothing matches that search"
                                : "Nothing waiting"}
                        </p>

                        <p className="mt-1 text-base text-muted">
                            {filters.search
                                ? "Try the taxpayer's name or the reference number."
                                : "Every referral registered at the counter has its details. Completed ones are in History."}
                        </p>
                    </div>
                )}

                {awaitingDetails?.links?.length > 3 && (
                    <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-base text-muted">
                            Showing{" "}
                            <span className="font-semibold text-navy-900">
                                {awaitingDetails.from ?? 0}–
                                {awaitingDetails.to ?? 0}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-navy-900">
                                {awaitingDetails.total ?? 0}
                            </span>
                        </p>

                        <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                            {awaitingDetails.links.map((link, index) => (
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

            <ArrivalFormModal
                open={registering}
                onClose={() => setRegistering(false)}
                fromSection={fromSection}
            />

            <DetailsFormModal
                open={Boolean(completing)}
                onClose={() => setCompleting(null)}
                onCompleted={(document) =>
                    setJustCompleted(document.document_id)
                }
                document={completing}
                sections={sections}
                options={referralOptions}
            />

            {justCompleted && (
                <DocumentTrailModal
                    documentId={justCompleted}
                    onClose={() => setJustCompleted(null)}
                />
            )}
        </EmployeeLayout>
    );
}
