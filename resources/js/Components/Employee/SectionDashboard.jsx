import { Link } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import Icon from "@/Components/Employee/Icon";
import IncomingDocuments from "@/Pages/Employees/Documents/IncomingDocuments";

/*
 * The body of every section dashboard.
 *
 * Deliberately one job only: what has been sent to us and needs
 * receiving. Registering a referral, and the list of referrals we have
 * sent out, live on their own screen - the button below goes there with
 * the form already open.
 *
 * Each section's page file passes its own wording and renders this.
 */
export default function SectionDashboard({
    title,
    eyebrow,
    blurb,
    documents = [],
}) {
    return (
        <EmployeeLayout title={title}>
            <div className="space-y-6">
                {/* Who you are, and the one thing you can start here */}
                <div className="rounded-2xl bg-navy-900 p-6 sm:p-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold tracking-widest text-accent-400 uppercase">
                                {eyebrow}
                            </p>

                            <h2 className="mt-2 text-2xl font-bold text-white">
                                Documents on your desk
                            </h2>

                            <p className="mt-2 max-w-2xl text-base text-navy-200">
                                {blurb}
                            </p>
                        </div>

                        <Link
                            href={route("referrals.index", { new: 1 })}
                            className="inline-flex min-h-13 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 text-lg font-semibold text-white shadow-sm transition hover:bg-brand-700 lg:w-auto"
                        >
                            <Icon name="add" />
                            New referral
                        </Link>
                    </div>
                </div>

                <IncomingDocuments documents={documents} />
            </div>
        </EmployeeLayout>
    );
}
