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

import ArrivalFormPanel from "@/Components/Employee/Referrals/ArrivalFormPanel";
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
 * Two frames rather than a dialog over the table. Registering an arrival
 * is a different job from looking through the register, done while
 * somebody stands at the counter, and it gets the screen to itself.
 */

const TABS = [
    { key: "", label: "All referrals" },
    { key: "waiting", label: "Waiting for their details" },
    { key: "slip", label: "With a slip" },
];

function StatusPill({ document }) {
    if (document.details_completed_at) {
        return (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ok-100 px-3 py-1 text-sm font-bold text-ok-600">
                <Icon name="check" />
                Slip ready
            </span>
        );
    }

    return (
        <span className="shrink-0 rounded-full bg-accent-100 px-3 py-1 text-sm font-bold text-navy-900">
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
}) {
    const [completing, setCompleting] = useState(null);

    // The document being looked at, and whether to go straight to its slip.
    const [opened, setOpened] = useState(null);

    const { flash } = usePage().props;
    const { notify } = useNotice();

    const rows = documents?.data ?? [];

    useEffect(() => {
        if (!flash?.success) return;

        notify({ title: "Done", message: flash.success });
    }, [flash?.id]);

    /*
     * The frame and the filter both live in the address, so the browser
     * back button behaves and a link can point at either.
     */
    const go = (params) =>
        router.get(route("referrals.index"), params, {
            preserveState: true,
            preserveScroll: true,
        });

    const showRegister = () => go({ frame: "register" });

    const showList = (status = filters.status ?? "") =>
        go({
            status: status || undefined,
            search: filters.search || undefined,
        });

    if (frame === "register") {
        return (
            <EmployeeLayout title="Register an arrival">
                <ArrivalFormPanel
                    fromSection={fromSection}
                    onCancel={() => showList()}
                    onRegistered={() => showList("waiting")}
                />
            </EmployeeLayout>
        );
    }

    return (
        <EmployeeLayout title="Referrals">
            <EmployeeCard>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-navy-900">
                            Referrals
                        </h2>

                        <p className="mt-1 text-base text-muted">
                            Everything this section has registered. Tap one to
                            see it in full, or to print its reference slip.
                        </p>
                    </div>

                    <EmployeeButton
                        size="lg"
                        onClick={showRegister}
                        className="w-full shrink-0 lg:w-auto"
                    >
                        <Icon name="add" />
                        Register an arrival
                    </EmployeeButton>
                </div>

                {/*
                 * The counts are the tabs. Pressing the number beside
                 * "Waiting for their details" is how you get to just those.
                 */}
                <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-4">
                    {TABS.map((tab) => {
                        const current = (filters.status ?? "") === tab.key;

                        const count = counts[tab.key || "all"] ?? 0;

                        return (
                            <button
                                key={tab.key || "all"}
                                type="button"
                                onClick={() => showList(tab.key)}
                                aria-current={current ? "true" : undefined}
                                className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-base font-semibold transition ${
                                    current
                                        ? "bg-navy-900 text-white"
                                        : "bg-paper text-navy-800 hover:bg-brand-50"
                                }`}
                            >
                                {tab.label}

                                <span
                                    className={`rounded-full px-2 py-0.5 text-sm font-bold ${
                                        current
                                            ? "bg-accent-400 text-navy-900"
                                            : tab.key === "waiting" && count > 0
                                              ? "bg-accent-400 text-navy-900"
                                              : "bg-navy-200 text-navy-900"
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 lg:w-96">
                    <SearchInput
                        label="Find a referral"
                        initialValue={filters.search}
                        placeholder="Taxpayer or reference no..."
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
                                        <p className="truncate text-lg font-bold text-navy-900">
                                            {document.taxpayer_name ??
                                                "No taxpayer on record"}
                                        </p>

                                        <p className="mt-0.5 font-mono text-sm text-muted">
                                            {document.tracking_number}
                                        </p>

                                        <p className="mt-1 text-base text-muted">
                                            Registered{" "}
                                            {exactTime(document.created_at)}
                                        </p>
                                    </button>

                                    <div className="flex shrink-0 flex-col items-end justify-center gap-2 py-4 pr-4">
                                        <StatusPill document={document} />

                                        {waiting ? (
                                            <>
                                                <AgeBadge document={document} />

                                                <EmployeeButton
                                                    variant="secondary"
                                                    onClick={() =>
                                                        setCompleting(document)
                                                    }
                                                >
                                                    <Icon name="register" />
                                                    Complete details
                                                </EmployeeButton>
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
                        <p className="text-lg font-semibold text-navy-800">
                            {filters.search
                                ? "Nothing matches that search"
                                : filters.status === "waiting"
                                  ? "Nothing waiting for details"
                                  : "No referrals registered yet"}
                        </p>

                        <p className="mt-1 text-base text-muted">
                            {filters.search
                                ? "Try the taxpayer's name or the reference number."
                                : "Press Register an arrival when a document comes in."}
                        </p>
                    </div>
                )}

                {documents?.links?.length > 3 && (
                    <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-base text-muted">
                            Showing{" "}
                            <span className="font-semibold text-navy-900">
                                {documents.from ?? 0}–{documents.to ?? 0}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-navy-900">
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
                                            : "border-line bg-white text-navy-800 hover:bg-paper"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </EmployeeCard>

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
                    onClose={() => setOpened(null)}
                />
            )}
        </EmployeeLayout>
    );
}
