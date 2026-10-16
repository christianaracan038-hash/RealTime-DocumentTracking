import { router } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import Icon from "@/Components/Employee/Icon";
import DashboardStats from "@/Components/Employee/DashboardStats";
import IncomingDocuments from "@/Pages/Employees/Documents/IncomingDocuments";
import EmployeeButton from "@/Components/Employee/EmployeeButton";

export default function SectionDashboard({
    title,
    eyebrow,
    blurb,
    documents = [],
    filters = {},
    stats = {},
}) {
    return (
        <EmployeeLayout title={title}>
            <div className="space-y-6">
                <div className="rounded-2xl bg-navy-900 p-6 sm:p-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold tracking-widest text-accent-400 uppercase">
                                {eyebrow}
                            </p>

                            <h2 className="mt-2 text-2xl font-bold text-white">
                                Documents on your Desk
                            </h2>

                            <p className="mt-2 max-w-2xl text-base text-navy-200">
                                {blurb}
                            </p>
                        </div>

                        <EmployeeButton
                            size="lg"
                            onClick={() =>
                                router.visit(
                                    route("referrals.index", { new: 1 }),
                                )
                            }
                            className="w-full shrink-0 !border-red-600 !bg-red-600 !text-white hover:!border-red-700 hover:!bg-red-700 lg:w-auto"
                        >
                            <Icon name="add" />
                            New Referral
                        </EmployeeButton>
                    </div>
                </div>

                <DashboardStats stats={stats} />

                <IncomingDocuments documents={documents} filters={filters} />
            </div>
        </EmployeeLayout>
    );
}
