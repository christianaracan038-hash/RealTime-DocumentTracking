import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import IncomingDocuments from "@/Pages/Employees/Documents/IncomingDocuments";

export default function Dashboard({ incomingDocuments = [] }) {
    return (
        <EmployeeLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">
                        Assessment Dashboard
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Manage Assessment Section documents.
                    </p>
                </div>

                <IncomingDocuments documents={incomingDocuments} />
            </div>
        </EmployeeLayout>
    );
}
