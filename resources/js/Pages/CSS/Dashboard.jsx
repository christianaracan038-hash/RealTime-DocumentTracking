import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import IncomingDocuments from "@/Pages/Employees/Documents/IncomingDocuments";

export default function Dashboard({ documents = [] }) {
    return (
        <EmployeeLayout title="CSS Dashboard">
            <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-2xl font-semibold text-slate-900">
                        Client Support Section
                    </h2>

                    <p className="mt-2 text-slate-500">
                        Documents routed to the Client Support Section.
                    </p>
                </div>

                <IncomingDocuments documents={documents} />
            </div>
        </EmployeeLayout>
    );
}
