export default function RoleTable({ roles }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                        Role List
                    </h3>

                    <p className="text-sm text-slate-500">
                        Review the roles currently available.
                    </p>
                </div>

                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    Management
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Role Name
                            </th>

                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Description
                            </th>

                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Status
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 bg-white">
                        {roles.map((role) => (
                            <tr key={role.role_id}>
                                <td className="px-4 py-3 font-medium text-slate-800">
                                    {role.role_name}
                                </td>

                                <td className="px-4 py-3 text-slate-600">
                                    {role.description || "—"}
                                </td>

                                <td className="px-4 py-3">
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                            role.is_active
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        {role.is_active ? "Active" : "Inactive"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
