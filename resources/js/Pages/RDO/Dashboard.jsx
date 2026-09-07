import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import IncomingDocuments from "@/Pages/Employees/Documents/IncomingDocuments";

export default function Dashboard({ documents = [] }) {
    return (
        <EmployeeLayout title="RDO Dashboard">
            <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-l-4 border-[#A6192E] p-6">
                        <h2 className="mt-1 text-2xl font-bold text-[#003B71]">
                            RDO Dashboard
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Manage and monitor incoming documents for the RDO
                            section.
                        </p>
                    </div>

                    <div className="h-1 bg-[#F6C344]" />
                </div>

                <IncomingDocuments documents={documents} />
            </div>
        </EmployeeLayout>
    );
}
