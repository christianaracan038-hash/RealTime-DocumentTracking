import { router, usePage } from "@inertiajs/react";

import Icon from "@/Components/Employee/Icon";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import { exactTime } from "@/Components/Employee/Referrals/referral";

/*
 * Notes the RDO has left on a document, shown to the section holding it.
 *
 * The RDO writes these when something has stopped moving, so they are
 * the first thing worth reading on a document that is sitting too long -
 * they appear above the details, not buried under them. Acknowledging
 * one tells the RDO it was read, which is all it does; the document
 * itself is unaffected.
 */
export default function DocumentComments({ document }) {
    const { auth } = usePage().props;

    const mySectionId = auth?.employee?.section_id;

    // Only what was addressed to this section.
    const comments = (document?.comments ?? []).filter(
        (comment) => Number(comment.to_section_id) === Number(mySectionId),
    );

    if (comments.length === 0) {
        return null;
    }

    const acknowledge = (comment) => {
        router.patch(
            route("comments.acknowledge", comment.comment_id),
            {},
            { preserveScroll: true },
        );
    };

    return (
        <div className="rounded-xl border border-accent-400 bg-accent-100 p-4">
            <p className="flex items-center gap-2 text-base font-bold text-navy-900">
                <Icon name="comment" className="text-brand-700" />
                {comments.length === 1
                    ? "A note from the RDO's Office"
                    : `${comments.length} notes from the RDO's Office`}
            </p>

            <ul className="mt-3 space-y-3">
                {comments.map((comment) => (
                    <li
                        key={comment.comment_id}
                        className="rounded-lg bg-white p-3 ring-1 ring-line"
                    >
                        <p className="text-base text-navy-900">
                            {comment.body}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm text-muted">
                                {comment.author?.username}
                                {comment.author?.username && " · "}
                                {exactTime(comment.created_at)}
                            </p>

                            {comment.acknowledged ? (
                                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ok-600">
                                    <Icon name="check" />
                                    Acknowledged
                                </span>
                            ) : (
                                <EmployeeButton
                                    variant="secondary"
                                    onClick={() => acknowledge(comment)}
                                >
                                    <Icon name="check" />
                                    Got it
                                </EmployeeButton>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
