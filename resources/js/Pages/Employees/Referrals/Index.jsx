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

import ReferralFormPanel from "@/Components/Employee/Referrals/ReferralFormPanel";
import SectionReferralPanel from "@/Components/Employee/Referrals/SectionReferralPanel";
import DetailsFormModal from "@/Components/Employee/Referrals/DetailsFormModal";
import DocumentTrailModal from "@/Components/Employee/Referrals/DocumentTrailModal";
import { exactTime } from "@/Components/Employee/Referrals/referral";

/*
 * The section's register of referrals.
 *
 * Every referral this office has issued, in one table, in the shape the
 * office actually needs to recognise one: the taxpayer, the reference
 * number, and when it was registered. Nothing else - the concerns and
 * remarks are a click away, and putting them in the row made a register
 * that nobody could scan down.
 *
 * All text on this screen is black, by request of the office: grey text
 * was hard to read on older monitors.
 */

/*
 * The three counts, which are also the filter.
 *
 * Drawn as cards rather than pills so they carry the same weight as the
 * dashboard's: on both screens these are the numbers somebody reads
 * first, and a count that matters should not look like a tab.
 *
 * `tone: "act"` is the one with work in it - it takes the attention
 * colour, and only while it is not zero.
 */
const TABS = [
    {
        key: "",
        label: <span className="text-xl">All Referrals</span>,
        icon: "referrals",
    },
    {
        key: "waiting",
        label: <span className="text-xl">Waiting for Details</span>,
        icon: "register",
        tone: "act",
    },
    {
        key: "slip",
        label: <span className="text-xl">Slip Ready</span>,
        icon: "print",
    },
];

function CountCard({ tab, count, current, onSelect }) {
    const acting = tab.tone === "act" && count > 0;

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-current={current ? "true" : undefined}
            className={`flex flex-col rounded-2xl border-2 p-5 text-left shadow-sm shadow-navy-900/5 transition ${
                current
                    ? "border-brand-600 bg-brand-50"
                    : "border-line bg-surface hover:border-brand-200"
            }`}
        >
            <span className="flex items-start justify-between gap-3">
                <span className="text-base font-semibold text-black">
                    {tab.label}
                </span>

                <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        acting
                            ? "bg-accent-400 text-black"
                            : "bg-brand-50 text-brand-700"
                    }`}
                >
                    <Icon name={tab.icon} />
                </span>
            </span>

            <span className="mt-2 block text-4xl font-bold text-black">
                {count}
            </span>

            <span className="mt-1 block text-sm text-black">{tab.hint}</span>

            {/* Which one the list below is showing */}
            <span
                aria-hidden="true"
                className={`mt-3 block h-1 rounded-full ${
                    current ? "bg-brand-600" : "bg-transparent"
                }`}
            />
        </button>
    );
}

function StatusPill({ document }) {
    if (document.details_completed_at) {
        return (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ok-600 px-3 py-1 text-sm font-bold text-white">
                <Icon name="check" />
                Slip ready
            </span>
        );
    }

    return (
        <span className="shrink-0 rounded-full bg-accent-100 px-3 py-1 text-sm font-bold text-black">
            Waiting for details
        </span>
    );
}

export default function Index({
    documents,
    counts = {},
    sections = [],
    referralOptions = {},
    fromSection = null,
    filters = {},
    frame = "list",
    openSlipFor = null,
    usesForm2309 = true,
    canCompleteDetails = false,
}) {
    const [completing, setCompleting] = useState(null);

    const [registering, setRegistering] = useState(frame === "register");

    // The document being looked at, and whether to go straight to its slip.
    const [opened, setOpened] = useState(
        openSlipFor ? { id: openSlipFor, slip: true } : null,
    );

    const { flash } = usePage().props;
    const { notify } = useNotice();

    const rows = documents?.data ?? [];

    const tabs = usesForm2309
        ? TABS
        : TABS.filter((tab) => tab.key !== "waiting");

    useEffect(() => {
        if (!flash?.success) return;

        notify({ title: "Done", message: flash.success });
    }, [flash?.id]);

    useEffect(() => {
        if (!openSlipFor) return;

        setRegistering(false);
        setOpened({ id: openSlipFor, slip: true });
    }, [openSlipFor]);

    /*
     * The frame and the filter both live in the address, so the browser
     * back button behaves and a link can point at either.
     */
    const go = (params) =>
        router.get(route("referrals.index"), params, {
            preserveState: true,
            preserveScroll: true,
        });

    const showList = (status = filters.status ?? "") =>
        go({
            status: status || undefined,
            search: filters.search || undefined,
        });

    return (
        <EmployeeLayout title="Referrals">
            <EmployeeCard>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        {/* <h2 className="text-xl font-bold text-black">
                            Referrals
                        </h2> */}
                    </div>

                    <EmployeeButton
                        size="lg"
                        onClick={() => setRegistering(true)}
                        className="w-full shrink-0 lg:w-auto"
                    >
                        <Icon name="add" />
                        New Referral
                    </EmployeeButton>
                </div>

                {/*
                 * The counts are the filter. Pressing one shows just
                 * those below.
                 */}
                <div
                    className={`mt-6 grid gap-4 ${
                        tabs.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
                    }`}
                >
                    {tabs.map((tab) => (
                        <CountCard
                            key={tab.key || "all"}
                            tab={tab}
                            count={counts[tab.key || "all"] ?? 0}
                            current={(filters.status ?? "") === tab.key}
                            onSelect={() => showList(tab.key)}
                        />
                    ))}
                </div>

                {/*
                 * Searching is how anybody actually finds one referral
                 * among a year of them, so it gets a block of its own
                 * rather than a thin box in a corner.
                 */}
                <div className="mt-5">
                    <SearchInput
                        size="lg"
                        label={
                            usesForm2309 ? "Find a Taxpayer" : "Find a referral"
                        }
                        initialValue={filters.search}
                        placeholder={
                            usesForm2309
                                ? "Type a name or a reference number"
                                : "Type part of the description or a reference number"
                        }
                        only={["documents", "counts", "filters"]}
                    />
                </div>

                {rows.length > 0 ? (
                    <ul className="mt-5 divide-y divide-line rounded-xl border border-line">
                        {rows.map((document) => {
                            const waiting = !document.details_completed_at;

                            const urgency = waiting
                                ? urgencyOf(document)
                                : null;

                            return (
                                <li
                                    key={document.document_id}
                                    className="flex items-stretch"
                                >
                                    {/* Only unfinished work carries urgency */}
                                    <span
                                        aria-hidden="true"
                                        className={`w-1.5 shrink-0 ${
                                            urgency?.spine ?? "bg-transparent"
                                        }`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpened({
                                                id: document.document_id,
                                                slip: false,
                                            })
                                        }
                                        className="min-w-0 flex-1 px-4 py-4 text-left transition hover:bg-brand-50"
                                    >
                                        {usesForm2309 ? (
                                            <p className="truncate text-lg font-bold text-black">
                                                {document.taxpayer_name ??
                                                    "No taxpayer on record"}
                                            </p>
                                        ) : (
                                            <p className="line-clamp-2 text-lg font-bold text-black">
                                                {document.concern ||
                                                    "No description"}
                                            </p>
                                        )}

                                        <p className="mt-0.5 font-mono text-sm text-black">
                                            {document.tracking_number}
                                        </p>

                                        {!usesForm2309 &&
                                            document.destination_section && (
                                                <p className="mt-1 text-base font-semibold text-black">
                                                    To{" "}
                                                    {
                                                        document
                                                            .destination_section
                                                            .section_name
                                                    }
                                                </p>
                                            )}

                                        <p className="mt-1 text-base text-black">
                                            Registered{" "}
                                            {exactTime(document.created_at)}
                                        </p>
                                    </button>

                                    <div className="flex shrink-0 flex-col items-end justify-center gap-2 py-4 pr-4">
                                        <StatusPill document={document} />

                                        {waiting ? (
                                            <>
                                                <AgeBadge document={document} />

                                                {canCompleteDetails && (
                                                    <EmployeeButton
                                                        variant="secondary"
                                                        onClick={() =>
                                                            setCompleting(
                                                                document,
                                                            )
                                                        }
                                                    >
                                                        <Icon name="register" />
                                                        Complete details
                                                    </EmployeeButton>
                                                )}
                                            </>
                                        ) : (
                                            <EmployeeButton
                                                variant="quiet"
                                                onClick={() =>
                                                    setOpened({
                                                        id: document.document_id,
                                                        slip: true,
                                                    })
                                                }
                                            >
                                                <Icon name="print" />
                                                Reference slip
                                            </EmployeeButton>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="mt-5 rounded-xl border border-dashed border-line py-14 text-center">
                        <p className="text-lg font-semibold text-black">
                            {filters.search
                                ? "No referrals match your search."
                                : filters.status === "waiting"
                                  ? "No referrals are waiting for details."
                                  : "No referrals have been registered yet."}
                        </p>

                        <p className="mt-1 text-base text-black">
                            {filters.search
                                ? usesForm2309
                                    ? "Try the taxpayer's name or the reference number."
                                    : "Try part of the description or the reference number."
                                : "Press “Register a referral” when a new document comes in."}
                        </p>
                    </div>
                )}

                {documents?.links?.length > 3 && (
                    <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-base text-black">
                            Showing{" "}
                            <span className="font-semibold text-black">
                                {documents.from ?? 0}–{documents.to ?? 0}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-black">
                                {documents.total ?? 0}
                            </span>
                        </p>

                        <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                            {documents.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url &&
                                        router.visit(link.url, {
                                            preserveState: true,
                                            preserveScroll: true,
                                        })
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`min-h-11 rounded-xl border px-4 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                        link.active
                                            ? "border-brand-600 bg-brand-600 text-white"
                                            : "border-line bg-white text-black hover:bg-sunken"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </EmployeeCard>

            {registering && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/70 p-4 sm:p-8"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="w-full max-w-2xl">
                        {usesForm2309 ? (
                            <ReferralFormPanel
                                sections={sections}
                                options={referralOptions}
                                fromSection={fromSection}
                                onCancel={() => setRegistering(false)}
                                onRegistered={() => {}}
                            />
                        ) : (
                            <SectionReferralPanel
                                sections={sections}
                                fromSection={fromSection}
                                onCancel={() => setRegistering(false)}
                            />
                        )}
                    </div>
                </div>
            )}

            <DetailsFormModal
                open={Boolean(completing)}
                onClose={() => setCompleting(null)}
                onCompleted={(document) =>
                    /*
                     * Straight to the slip - the document can be routed
                     * from here on, and the slip is what carries its QR
                     * onto the paper.
                     */
                    setOpened({ id: document.document_id, slip: true })
                }
                document={completing}
                sections={sections}
                options={referralOptions}
            />

            {opened && (
                <DocumentTrailModal
                    documentId={opened.id}
                    openSlip={opened.slip}
                    slipVariant={usesForm2309 ? "2309" : "section"}
                    onClose={() => setOpened(null)}
                />
            )}
        </EmployeeLayout>
    );
}
