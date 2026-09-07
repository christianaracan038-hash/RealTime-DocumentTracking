import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import IncomingDocuments from "@/Pages/Employees/Documents/IncomingDocuments";

export default function Dashboard({ incomingDocuments = [] }) {
    return (
        <EmployeeLayout>
            <div className="space-y-6 p-6">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-l-4 border-[#A6192E] p-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#A6192E]">
                            Bureau of Internal Revenue
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-[#2F3D58]">
                            Assessment Dashboard
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Manage and monitor documents for the Assessment
                            Section.
                        </p>
                    </div>

                    <div className="h-1 bg-[#F9CD19]" />
                </div>

                <IncomingDocuments documents={incomingDocuments} />
            </div>
        </EmployeeLayout>
    );
}
