import { useState } from "react";
import { router } from "@inertiajs/react";

import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import Icon from "@/Components/Employee/Icon";
import DashboardStats from "@/Components/Employee/DashboardStats";
import IncomingDocuments from "@/Pages/Employees/Documents/IncomingDocuments";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import BatchDocumentScanner from "@/Pages/Employees/Documents/BatchDocumentScanner";

export default function SectionDashboard({
    title,
    eyebrow,
    blurb,
    documents = [],
    filters = {},
    stats = {},
}) {
    const [showFastScan, setShowFastScan] = useState(false);

    const refreshDashboard = () =>
        router.reload({
            only: ["documents", "stats"],
            preserveScroll: true,
            preserveState: true,
        });

    const handleClose = () => {
        setShowFastScan(false);
        refreshDashboard();
    };

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

                        <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row lg:w-auto">
                            <EmployeeButton
                                size="lg"
                                onClick={() => setShowFastScan(true)}
                                className="w-full !border-yellow-400 !bg-yellow-400 !text-slate-900 hover:!border-yellow-500 hover:!bg-yellow-500 lg:w-auto"
                            >
                                <Icon name="scan" />
                                Scan QR Code
                            </EmployeeButton>

                            <EmployeeButton
                                size="lg"
                                onClick={() =>
                                    router.visit(
                                        route("referrals.index", { new: 1 }),
                                    )
                                }
                                className="w-full !border-red-600 !bg-red-600 !text-white hover:!border-red-700 hover:!bg-red-700 lg:w-auto"
                            >
                                <Icon name="add" />
                                New Referral
                            </EmployeeButton>
                        </div>
                    </div>
                </div>

                <DashboardStats stats={stats} />

                <IncomingDocuments documents={documents} filters={filters} />
            </div>

            {showFastScan && (
                <BatchDocumentScanner
                    onClose={() => {
                        setShowFastScan(false);
                        refreshDashboard();
                    }}
                    onReceived={refreshDashboard}
                    onForwarded={refreshDashboard}
                />
            )}
        </EmployeeLayout>
    );
}
