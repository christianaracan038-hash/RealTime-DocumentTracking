import { useState } from "react";
import { router } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import DocumentTrailModal from "@/Components/Employee/Referrals/DocumentTrailModal";
import { exactTime } from "@/Components/Employee/Referrals/referral";

/*
 * Notes the RDO has sent to this section.
 *
 * Unread first, because those are the ones somebody still has to answer
 * for. Pressing "Got it" does nothing to the document - it only tells
 * the RDO the message was read, so it knows whether to chase again.
 */
export default function Inbox({ comments }) {
    const [openId, setOpenId] = useState(null);

    const rows = comments?.data ?? [];

    const unread = rows.filter((comment) => !comment.acknowledged).length;

    const acknowledge = (comment) => {
        router.patch(
            route("comments.acknowledge", comment.comment_id),
            {},
            { preserveScroll: true },
        );
    };

    const goToPage = (url) => {
        if (!url) return;

        router.visit(url, { preserveState: true, preserveScroll: true });
    };

    return (
        <EmployeeLayout title="Comments">
            <EmployeeCard>
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-navy-900">
                            Notes from the RDO's Office
                        </h2>

                        <p className="mt-1 text-base text-muted">
                            Sent to your section about documents you are
                            holding. Tap the taxpayer's name to open the
                            document.
                        </p>
                    </div>

                    {unread > 0 && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-accent-400 px-4 py-1.5 text-base font-bold text-navy-900">
                            <Icon name="comment" />
                            {unread} to read
                        </span>
                    )}
                </div>

                {rows.length > 0 ? (
                    <ul className="space-y-3">
                        {rows.map((comment) => (
                            <li
                                key={comment.comment_id}
                                className={`flex overflow-hidden rounded-xl border ${
                                    comment.acknowledged
                                        ? "border-line bg-white"
                                        : "border-accent-400 bg-accent-100"
                                }`}
                            >
                                {/* Unread carries a spine, like an urgent document */}
                                <span
                                    aria-hidden="true"
                                    className={`w-1.5 shrink-0 ${
                                        comment.acknowledged
                                            ? "bg-navy-200"
                                            : "bg-accent-400"
                                    }`}
                                />

                                <div className="min-w-0 flex-1 p-5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenId(comment.document_id)
                                        }
                                        className="text-left"
                                    >
                                        <p className="text-lg font-bold text-navy-900 underline-offset-4 hover:underline">
                                            {comment.document?.taxpayer_name ??
                                                "No taxpayer on record"}
                                        </p>

                                        <p className="mt-0.5 font-mono text-sm text-muted">
                                            {comment.document?.tracking_number}
                                        </p>
                                    </button>

                                    <p className="mt-3 text-base text-navy-900">
                                        {comment.body}
                                    </p>

                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-sm text-muted">
                                            {comment.author?.username}
                                            {comment.author?.username && " · "}
                                            {exactTime(comment.created_at)}
                                        </p>

                                        {comment.acknowledged ? (
                                            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ok-600">
                                                <Icon name="check" />
                                                Read
                                                {comment.reader?.username
                                                    ? ` by ${comment.reader.username}`
                                                    : ""}
                                            </span>
                                        ) : (
                                            <EmployeeButton
                                                variant="secondary"
                                                onClick={() =>
                                                    acknowledge(comment)
                                                }
                                            >
                                                <Icon name="check" />
                                                Got it
                                            </EmployeeButton>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="rounded-xl border border-dashed border-line py-14 text-center">
                        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-ok-100 text-2xl text-ok-600">
                            <Icon name="check" />
                        </span>

                        <p className="text-lg font-semibold text-navy-800">
                            Nothing to read
                        </p>

                        <p className="mt-1 text-base text-muted">
                            If the RDO asks about a document you are holding, it
                            will appear here.
                        </p>
                    </div>
                )}

                {comments?.links?.length > 3 && (
                    <div className="mt-5 flex flex-wrap justify-center gap-2 border-t border-line pt-5">
                        {comments.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url}
                                onClick={() => goToPage(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`min-h-11 rounded-xl border px-4 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                    link.active
                                        ? "border-brand-600 bg-brand-600 text-white"
                                        : "border-line bg-white text-navy-800 hover:bg-paper"
                                }`}
                            />
                        ))}
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
