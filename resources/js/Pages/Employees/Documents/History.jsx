import { useState } from "react";
import { router } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import EmployeeBadge from "@/Components/Employee/EmployeeBadge";
import Icon from "@/Components/Employee/Icon";
import SearchInput from "@/Components/Employee/SearchInput";
import DocumentTrailModal from "@/Components/Employee/Referrals/DocumentTrailModal";
import { longDate } from "@/Components/Employee/Referrals/referral";

/*
 * Document history - the archive.
 *
 * Each row carries only what is needed to recognise a document: the
 * taxpayer and the date. Opening one fetches the rest, including its
 * movement trail, from documents.detail.
 *
 * This is deliberate. The list used to load every document's complete
 * trail, with four relations per movement, for all ten rows on a page -
 * most of which nobody ever looked at. That cost grows with the archive;
 * this does not.
 */
export default function History({ documents, filters = {} }) {
    const [openId, setOpenId] = useState(null);

    const rows = documents?.data ?? [];

    const goToPage = (url) => {
        if (!url) return;

        router.visit(url, { preserveState: true, preserveScroll: true });
    };

    return (
        <EmployeeLayout title="Document History">
            <EmployeeCard>
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-navy-900">
                            Document history
                        </h2>

                        <p className="mt-1 text-base text-muted">
                            Documents you created, or that passed through your
                            section. Tap one to see its full detail and where it
                            has been.
                        </p>
                    </div>

                    <div className="w-full lg:w-96">
                        <SearchInput
                            label="Find a document"
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

                                    <EmployeeBadge
                                        status={document.status?.status_name}
                                        className="hidden sm:inline-flex"
                                    />

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
                            No documents found
                        </p>

                        <p className="mt-1 text-base text-muted">
                            {filters.search
                                ? "Try another taxpayer name, concern, reference number, section, or employee."
                                : "Documents you handle will appear here."}
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
