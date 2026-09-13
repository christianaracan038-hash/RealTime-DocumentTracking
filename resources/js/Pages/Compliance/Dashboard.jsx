import EmployeeLayout from "@/Layouts/EmployeeLayouts";
import IncomingDocuments from "@/Pages/Employees/Documents/IncomingDocuments";

export default function Dashboard({ documents = [] }) {
    return (
        <EmployeeLayout title="Compliance Dashboard">
            <div className="space-y-6">
                <div className="rounded-2xl bg-navy-900 p-7">
                    <p className="text-sm font-semibold tracking-widest text-accent-400 uppercase">
                        Compliance Section
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-white">
                        Documents on your desk
                    </h2>

                    <p className="mt-2 max-w-2xl text-base text-navy-200">
                        Anything sent to Compliance waits here until someone
                        scans it in.
                    </p>
                </div>

                <IncomingDocuments documents={documents} />
            </div>
        </EmployeeLayout>
    );
}
