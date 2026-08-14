import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import IncomingDocuments from "@/Pages/Employees/Documents/IncomingDocuments";

export default function Dashboard({ documents = [] }) {
    return (
        <EmployeeLayout title="RDO Dashboard">
            <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-2xl font-semibold text-slate-900">
                        Welcome to RDO Dashboard
                    </h2>

                    <p className="mt-2 text-slate-500">
                        Manage documents for the RDO section.
                    </p>
                </div>

                <IncomingDocuments documents={documents} />
            </div>
        </EmployeeLayout>
    );
}
