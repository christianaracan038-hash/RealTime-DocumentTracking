import { useState } from "react";
import { router } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import Icon from "@/Components/Employee/Icon";
import SearchInput from "@/Components/Employee/SearchInput";
import DocumentTrailModal from "@/Components/Employee/Referrals/DocumentTrailModal";
import { longDate } from "@/Components/Employee/Referrals/referral";

/*
 * The archive: documents closed out because the taxpayer went
 * unresponsive.
 *
 * Same shape as History - a row carries a taxpayer and a date, and the
 * rest is fetched when one is opened - because this list only grows too.
 */
export default function Archive({ documents, filters = {} }) {
    const [openId, setOpenId] = useState(null);

    const rows = documents?.data ?? [];

    const goToPage = (url) => {
        if (!url) return;

        router.visit(url, { preserveState: true, preserveScroll: true });
    };

    return (
        <EmployeeLayout title="Archive">
            <EmployeeCard>
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-navy-900">
                            Archived documents
                        </h2>

                        <p className="mt-1 text-base text-muted">
                            Closed out because the taxpayer went unresponsive.
                            Kept for the record. Tap one to see its full detail
                            and where it went.
                        </p>
                    </div>

                    <div className="w-full lg:w-96">
                        <SearchInput
                            label="Find an archived document"
                            initialValue={filters.search}
                            placeholder="Taxpayer, concern, reference no..."
                        />
                    </div>
                </div>

                {rows.length > 0 ? (
                    <ul className="divide-y divide-line rounded-xl border border-line">
                        {rows.map((document) => (
                            <li key={document.document_id}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpenId(document.document_id)
                                    }
                                    className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-brand-50"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-200 text-navy-900">
                                        <Icon name="archive" />
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-lg font-bold text-navy-900">
                                            {document.taxpayer_name ??
                                                "No taxpayer on record"}
                                        </p>

                                        <p className="mt-0.5 text-base text-muted">
                                            {longDate(document.document_date) ||
                                                "No date"}
                                        </p>
                                    </div>

                                    <Icon
                                        name="next"
                                        className="shrink-0 text-muted"
                                    />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="rounded-xl border border-dashed border-line py-14 text-center">
                        <p className="text-lg font-semibold text-navy-800">
                            Nothing archived
                        </p>

                        <p className="mt-1 text-base text-muted">
                            {filters.search
                                ? "Nothing matches that search."
                                : "Documents closed out as unresponsive will appear here."}
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

            {openId && (
                <DocumentTrailModal
                    documentId={openId}
                    onClose={() => setOpenId(null)}
                />
            )}
        </EmployeeLayout>
    );
}
