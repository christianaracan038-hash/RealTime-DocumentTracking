import EmployeeLayout from "@/Layouts/EmployeeLayouts";

export default function Dashboard() {
    return (
        <EmployeeLayout title="RDO Dashboard">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-900">
                    Welcome to RDO Dashboard
                </h2>

                <p className="mt-2 text-slate-500">
                    Manage documents for the RDO section.
                </p>
            </div>
        </EmployeeLayout>
    );
}
