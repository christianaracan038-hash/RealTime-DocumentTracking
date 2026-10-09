import { useState } from "react";
import { useForm } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import EmployeeCard from "@/Components/Employee/EmployeeCard";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import AgeBadge from "@/Components/Employee/AgeBadge";
import Icon from "@/Components/Employee/Icon";
import { urgencyOf } from "@/Components/Employee/urgency";
import {
    exactTime,
    sectionLabel,
} from "@/Components/Employee/Referrals/referral";

/*
 * The RDO's view of documents sitting with other sections.
 *
 * Most transactions start and end here, so this is the office that
 * notices when something has stopped moving. Longest wait first, so
 * whatever has been stuck longest is the first thing on the screen,
 * with a box to write to whoever is holding it.
 */

function CommentBox({ document, onDone }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        body: "",
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("comments.store", document.document_id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onDone();
            },
        });
    };

    return (
        <form onSubmit={submit} className="mt-4 border-t border-line pt-4">
            <label className="mb-1.5 block text-sm font-semibold text-black">
                Message to {sectionLabel(document.current_section)}
            </label>

            <textarea
                rows="3"
                value={data.body}
                onChange={(e) => setData("body", e.target.value)}
                autoFocus
                placeholder="e.g. This has been with you for five days. Please forward it to Collection or tell us what is holding it up."
                className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-base text-black placeholder:text-muted focus:border-brand-600"
            />

            {errors.body && (
                <p className="mt-2 text-sm font-medium text-stop-600">
                    {errors.body}
                </p>
            )}

            <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <EmployeeButton
                    type="button"
                    variant="quiet"
                    onClick={onDone}
                    disabled={processing}
                >
                    Cancel
                </EmployeeButton>

                <EmployeeButton type="submit" disabled={processing}>
                    <Icon name="forward" />
                    {processing ? "Sending..." : "Send comment"}
                </EmployeeButton>
            </div>
        </form>
    );
}

export default function Comments({ stuck = [], sent = [] }) {
    const [writingTo, setWritingTo] = useState(null);

    const overdue = stuck.filter((d) => d.aging?.overdue).length;

    return (
        <EmployeeLayout title="Comments">
            <div className="space-y-6">
                <EmployeeCard>
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-black">
                                Records of overdued Documents/Process
                            </h2>
                        </div>

                        {overdue > 0 && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-stop-600 px-4 py-1.5 text-base font-bold text-white">
                                <Icon name="warning" />
                                {overdue} overdue
                            </span>
                        )}
                    </div>

                    {stuck.length > 0 ? (
                        <ul className="space-y-3">
                            {stuck.map((document) => {
                                const urgency = urgencyOf(document);
                                const unanswered = (
                                    document.comments ?? []
                                ).filter((c) => !c.acknowledged).length;

                                return (
                                    <li
                                        key={document.document_id}
                                        className={`flex overflow-hidden rounded-xl border ${
                                            document.aging?.overdue
                                                ? "border-stop-600"
                                                : "border-line"
                                        } ${urgency?.card ?? "bg-surface"}`}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`w-1.5 shrink-0 ${urgency?.spine ?? "bg-navy-200"}`}
                                        />

                                        <div className="min-w-0 flex-1 p-5">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-lg font-bold text-black">
                                                        {document.taxpayer_name ??
                                                            "No taxpayer on record"}
                                                    </p>

                                                    <p className="mt-0.5 font-mono text-sm text-black">
                                                        {
                                                            document.tracking_number
                                                        }
                                                    </p>
                                                </div>

                                                <AgeBadge document={document} />
                                            </div>

                                            <p className="mt-3 text-base text-black">
                                                Sitting with{" "}
                                                <span className="font-bold">
                                                    {sectionLabel(
                                                        document.current_section,
                                                    )}
                                                </span>{" "}
                                                &middot;{" "}
                                                {document.status?.status_name}
                                            </p>

                                            {/* What has already been said */}
                                            {(document.comments ?? []).length >
                                                0 && (
                                                <ul className="mt-3 space-y-2">
                                                    {document.comments.map(
                                                        (comment) => (
                                                            <li
                                                                key={
                                                                    comment.comment_id
                                                                }
                                                                className="rounded-lg bg-white/70 px-3 py-2 text-sm ring-1 ring-line"
                                                            >
                                                                <p className="text-black">
                                                                    {
                                                                        comment.body
                                                                    }
                                                                </p>

                                                                <p className="mt-1 text-xs text-black">
                                                                    {exactTime(
                                                                        comment.created_at,
                                                                    )}{" "}
                                                                    &middot;{" "}
                                                                    {comment.acknowledged ? (
                                                                        <span className="font-semibold text-black">
                                                                            Seen
                                                                        </span>
                                                                    ) : (
                                                                        <span className="font-semibold text-black">
                                                                            Not
                                                                            yet
                                                                            seen
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            )}

                                            {writingTo ===
                                            document.document_id ? (
                                                <CommentBox
                                                    document={document}
                                                    onDone={() =>
                                                        setWritingTo(null)
                                                    }
                                                />
                                            ) : (
                                                <EmployeeButton
                                                    variant="secondary"
                                                    onClick={() =>
                                                        setWritingTo(
                                                            document.document_id,
                                                        )
                                                    }
                                                    className="mt-4"
                                                >
                                                    <Icon name="comment" />
                                                    {unanswered > 0
                                                        ? "Send another comment"
                                                        : "Send a comment"}
                                                </EmployeeButton>
                                            )}
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

                            <p className="text-lg font-semibold text-black">
                                Nothing is sitting elsewhere
                            </p>

                            <p className="mt-1 text-base text-black">
                                Every document is either here or finished.
                            </p>
                        </div>
                    )}
                </EmployeeCard>

                {/* What has been sent, and whether it landed */}
                {sent.length > 0 && (
                    <EmployeeCard>
                        <h2 className="text-xl font-bold text-black">
                            Comments you have sent
                        </h2>

                        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                            {sent.map((comment) => (
                                <li key={comment.comment_id} className="p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-black">
                                                {comment.document
                                                    ?.taxpayer_name ??
                                                    "No taxpayer on record"}
                                            </p>

                                            <p className="mt-0.5 font-mono text-sm text-black">
                                                {
                                                    comment.document
                                                        ?.tracking_number
                                                }
                                            </p>
                                        </div>

                                        {comment.acknowledged ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-100 px-3 py-1 text-sm font-bold text-black">
                                                <Icon name="check" />
                                                Seen by{" "}
                                                {comment.reader?.username ??
                                                    sectionLabel(
                                                        comment.to_section,
                                                    )}
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-warn-100 px-3 py-1 text-sm font-bold text-black">
                                                Not yet seen
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-2 text-base text-black">
                                        {comment.body}
                                    </p>

                                    <p className="mt-1 text-sm text-black">
                                        To {sectionLabel(comment.to_section)}{" "}
                                        &middot; {exactTime(comment.created_at)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </EmployeeCard>
                )}
            </div>
        </EmployeeLayout>
    );
}
