import FormCard from "./FormCard";

/*
 * Every employee account, with the three things that can be done to one.
 *
 * Deactivated accounts stay in the list rather than disappearing -
 * somebody who resigned is still the person who received a document last
 * March, and their account has to remain for that trail to make sense.
 * They are greyed out and the only action offered is to reinstate them.
 */
export default function EmployeeTable({
    employees,
    onEdit,
    onResetPassword,
    onSetActive,
    search,
    onSearch,
}) {
    return (
        <FormCard
            title="Employee Accounts"
            description="Correct a name, set a new password, or stop someone signing in."
            badge={`${employees.length} account${employees.length === 1 ? "" : "s"}`}
        >
            <div className="mb-4">
                <input
                    type="search"
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Search by name, username, position or email..."
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Person
                            </th>

                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Section / Role
                            </th>

                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Status
                            </th>

                            <th className="px-4 py-3 text-right font-semibold text-slate-700">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 bg-white">
                        {employees.length === 0 && (
                            <tr>
                                <td
                                    colSpan="4"
                                    className="px-4 py-10 text-center text-slate-500"
                                >
                                    {search
                                        ? "No account matches that search."
                                        : "No employee accounts yet."}
                                </td>
                            </tr>
                        )}

                        {employees.map((employee) => (
                            <tr
                                key={employee.employee_id}
                                className={
                                    employee.is_active ? "" : "bg-slate-50/70"
                                }
                            >
                                <td className="px-4 py-3">
                                    <p
                                        className={`font-medium ${
                                            employee.is_active
                                                ? "text-slate-800"
                                                : "text-slate-500"
                                        }`}
                                    >
                                        {employee.display_name}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                        {employee.username}
                                        {employee.email
                                            ? ` · ${employee.email}`
                                            : ""}
                                    </p>

                                    {/* Accounts created before names existed */}
                                    {!employee.full_name && (
                                        <p className="mt-0.5 text-xs font-medium text-amber-700">
                                            No name on file
                                        </p>
                                    )}
                                </td>

                                <td className="px-4 py-3 text-slate-600">
                                    {employee.section?.section_name ?? "—"}

                                    <span className="block text-xs text-slate-500">
                                        {employee.role?.role_name ?? "—"}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                            employee.is_active
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-slate-200 text-slate-600"
                                        }`}
                                    >
                                        {employee.is_active
                                            ? "Active"
                                            : "Cannot sign in"}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(employee)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onResetPassword(employee)
                                            }
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Password
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onSetActive(
                                                    employee,
                                                    !employee.is_active,
                                                )
                                            }
                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                                employee.is_active
                                                    ? "border border-red-200 text-red-700 hover:bg-red-50"
                                                    : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                            }`}
                                        >
                                            {employee.is_active
                                                ? "Deactivate"
                                                : "Reactivate"}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </FormCard>
    );
}
