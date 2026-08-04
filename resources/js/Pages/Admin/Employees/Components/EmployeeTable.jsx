import FormCard from "./FormCard";

export default function EmployeeTable({ employees }) {
    return (
        <FormCard
            title="Employee Accounts"
            description="Track current staff access and permissions."
            badge="Overview"
        >
            <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Username
                            </th>

                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Section
                            </th>

                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Role
                            </th>

                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Status
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 bg-white">
                        {employees.map((employee) => (
                            <tr key={employee.employee_id}>
                                <td className="px-4 py-3 font-medium text-slate-800">
                                    {employee.username}
                                </td>

                                <td className="px-4 py-3 text-slate-600">
                                    {employee.section?.section_name ?? "—"}
                                </td>

                                <td className="px-4 py-3 text-slate-600">
                                    {employee.role?.role_name ?? "—"}
                                </td>

                                <td className="px-4 py-3">
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                            employee.is_active
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        {employee.is_active
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </FormCard>
    );
}
