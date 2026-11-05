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

    const allComments = document?.comments ?? [];

    // Only what was addressed to this section.
    const comments = allComments.filter(
        (comment) => Number(comment.to_section_id) === Number(mySectionId),
    );

    const delayNotices = comments.filter((c) => c.type === "delay_notice");
    const regularComments = comments.filter((c) => c.type !== "delay_notice");

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

    const renderDelayNotice = (comment) => (
        <li
            key={`delay-${comment.comment_id}`}
            className="rounded-lg border border-stop-600 bg-stop-50 p-3"
        >
            <p className="flex items-start gap-2 text-base text-stop-900">
                <Icon name="warning" className="text-stop-600 mt-0.5" />
                <span className="font-bold text-sm uppercase tracking-wider text-stop-700">
                    Delay Notice
                </span>
                <br />
                {comment.body}
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <p className="text-muted">
                    {comment.author?.username}
                    {comment.author?.username && " · "}
                    {exactTime(comment.created_at)}
                </p>

                {comment.acknowledged ? (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-ok-600">
                        <Icon name="check" />
                        Acknowledged
                    </span>
                ) : (
                    <EmployeeButton
                        variant="secondary"
                        size="sm"
                        onClick={() => acknowledge(comment)}
                    >
                        <Icon name="check" />
                        Got it
                    </EmployeeButton>
                )}
            </div>
        </li>
    );

    const renderRegularComment = (comment) => (
        <li
            key={`comment-${comment.comment_id}`}
            className="rounded-lg bg-white p-3 ring-1 ring-line"
        >
            <p className="text-base text-navy-900">{comment.body}</p>

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
    );

    return (
        <div className="rounded-xl border border-accent-400 bg-accent-100 p-4">
            {delayNotices.length > 0 && (
                <>
                    <p className="flex items-start gap-2 text-base font-bold text-stop-900 mb-3">
                        <Icon name="warning" className="text-stop-600 mt-0.5" />
                        <span>
                            ⚠️ Delay Notice{delayNotices.length > 1 ? "s" : ""}
                        </span>
                    </p>

                    <ul className="mt-0 space-y-3 mb-6">
                        {delayNotices.map(renderDelayNotice)}
                    </ul>
                </>
            )}

            {regularComments.length > 0 && (
                <>
                    <p className="flex items-center gap-2 text-base font-bold text-navy-900 mb-3">
                        <Icon name="comment" className="text-brand-700" />
                        {regularComments.length === 1
                            ? "A note from the RDO's Office"
                            : `${regularComments.length} notes from the RDO's Office`}
                    </p>

                    <ul className="mt-0 space-y-3">
                        {regularComments.map(renderRegularComment)}
                    </ul>
                </>
            )}
        </div>
    );
}
