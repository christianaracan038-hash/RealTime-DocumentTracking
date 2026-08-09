import EmployeeLayout from "@/Layouts/EmployeeLayouts";

import EmployeePageHeader from "@/Components/Employee/EmployeePageHeader";

import DocumentForm from "@/Components/Employee/Documents/DocumentForm";
import RecentDocumentsTable from "@/Components/Employee/Documents/RecentDocumentsTable";

export default function Create({ documents = [], sections = [] }) {
    return (
        <EmployeeLayout>
            <EmployeePageHeader
                title="Register Document"
                subtitle="Register a new document into the tracking system."
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Registration Form */}
                <div className="xl:col-span-1">
                    <DocumentForm sections={sections} />
                </div>

                {/* Recent Documents */}
                <div className="xl:col-span-2">
                    <RecentDocumentsTable documents={documents} />
                </div>
            </div>
        </EmployeeLayout>
    );
}
