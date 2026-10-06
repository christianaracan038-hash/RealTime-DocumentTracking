import { useState } from "react";
import { router } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import EmployeeBadge from "@/Components/Employee/EmployeeBadge";
import Icon from "@/Components/Employee/Icon";
import SearchInput from "@/Components/Employee/SearchInput";
S;
import DocumentTrailModal from "@/Components/Employee/Referrals/DocumentTrailModal";
import { longDate } from "@/Components/Employee/Referrals/referral";

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
                        <h2 className="text-xl font-bold text-black">
                            Document History
                        </h2>

                        <p className="mt-1 text-base text-black">
                            Documents you created or that passed through your
                            section. Tap a document to see its full details and
                            where it has been.
                        </p>
                    </div>
                </div>

                <div className="mt-5 mb-5">
                    <SearchInput
                        size="lg"
                        label="Find a document"
                        initialValue={filters.search}
                        placeholder="Type a taxpayer name, concern, or reference number"
                        hint="Any part of the text will do. All of your history is searched, not just this page."
                    />
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
                                    className="flex w-full items-center gap-4 px-4 py-4 text-left text-black transition hover:bg-brand-50"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-lg font-bold text-black">
                                            {document.taxpayer_name ??
                                                document.concern ??
                                                "No taxpayer on record"}
                                        </p>

                                        <p className="mt-0.5 text-base text-black">
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
                                        className="shrink-0 text-black"
                                    />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="rounded-xl border border-dashed border-line py-14 text-center">
                        <p className="text-lg font-semibold text-black">
                            No documents found
                        </p>

                        <p className="mt-1 text-base text-black">
                            {filters.search
                                ? "Try a different taxpayer name, concern, reference number, section, or employee."
                                : "Documents you handle will appear here."}
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
                                    onClick={() => goToPage(link.url)}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`min-h-11 rounded-xl border px-4 text-base font-medium text-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                        link.active
                                            ? "border-brand-600 bg-brand-100 font-bold"
                                            : "border-line bg-white hover:bg-sunken"
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
