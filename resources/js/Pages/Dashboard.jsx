import EmployeeLayout from "@/Layouts/EmployeeLayout";

import EmployeeCard from "@/Components/Employee/EmployeeCard";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import EmployeePageHeader from "@/Components/Employee/EmployeePageHeader";

export default function Dashboard() {
    return (
        <EmployeeLayout>
            <EmployeePageHeader
                title="RDO Dashboard"
                subtitle="Real-Time Document Tracking System"
                action={<EmployeeButton>Register Document</EmployeeButton>}
            />

            <EmployeeCard>
                <h2 className="text-xl font-semibold">Welcome to RDO</h2>

                <p className="mt-2 text-gray-600">
                    This reusable card will be used across all employee
                    sections.
                </p>
            </EmployeeCard>
        </EmployeeLayout>
    );
}
