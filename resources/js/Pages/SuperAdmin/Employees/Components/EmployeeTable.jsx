import { router } from "@inertiajs/react";
import FormCard from "./FormCard";
import Avatar from "@/Components/Employee/Avatar";

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
    roles,
    filters,
    onEdit,
    onResetPassword,
    onSetActive,
    onPhoto,
    search,
    onSearch,
    onRoleChange,
    onStatusChange,
}) {
    const rows = employees?.data ?? [];
    const hasFilters = Boolean(search || filters.roleId || filters.status);

    return (
        <FormCard
            title="Employee Accounts"
            description="Correct a name, set a new password, or stop someone signing in."
            badge={`${employees?.total ?? 0} account${employees?.total === 1 ? "" : "s"}`}
        >
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <input
                    type="search"
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Search by name, username, position or email..."
                    aria-label="Search employee accounts"
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />

                <select
                    value={filters.roleId}
                    onChange={(e) => onRoleChange(e.target.value)}
                    aria-label="Filter by role"
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                    <option value="">All roles</option>
                    {roles.map((role) => (
                        <option key={role.role_id} value={role.role_id}>
                            {role.role_name}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.status}
                    onChange={(e) => onStatusChange(e.target.value)}
                    aria-label="Filter by account status"
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
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
                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan="4"
                                    className="px-4 py-10 text-center text-slate-500"
                                >
                                    {hasFilters
                                        ? "No employee accounts match these filters."
                                        : "No employee accounts yet."}
                                </td>
                            </tr>
                        )}

                        {rows.map((employee) => (
                            <tr
                                key={employee.employee_id}
                                className={
                                    employee.is_active ? "" : "bg-slate-50/70"
                                }
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => onPhoto(employee)}
                                            title="Set a photograph"
                                            className="rounded-full transition hover:ring-2 hover:ring-indigo-400 hover:ring-offset-2"
                                        >
                                            <Avatar
                                                url={employee.avatar_url}
                                                name={employee.display_name}
                                                size="sm"
                                            />
                                        </button>

                                        <div className="min-w-0">
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
                                        </div>
                                    </div>
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
                                            onClick={() => onPhoto(employee)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Photo
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

            {employees?.total > 0 && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-600">
                        Showing {employees.from}–{employees.to} of{" "}
                        {employees.total} accounts
                    </p>

                    {employees.links?.length > 3 && (
                        <nav
                            aria-label="Employee account pages"
                            className="flex flex-wrap justify-center gap-2"
                        >
                            {employees.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url &&
                                        router.visit(link.url, {
                                            preserveState: true,
                                            preserveScroll: true,
                                        })
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                        link.active
                                            ? "bg-indigo-600 text-white"
                                            : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                                    }`}
                                />
                            ))}
                        </nav>
                    )}
                </div>
            )}
        </FormCard>
    );
}
