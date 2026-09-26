export default function RoleForm({ form, handleChange, handleSubmit }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-900">
                    Create Role
                </h3>

                <p className="text-sm text-slate-500">
                    Define a new role and assign it to your team.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Role Name
                    </label>

                    <input
                        type="text"
                        name="role_name"
                        value={form.role_name}
                        onChange={handleChange}
                        className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Description
                    </label>

                    <textarea
                        rows="3"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleChange}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Active role
                </label>

                <button
                    type="submit"
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                    Create Role
                </button>
            </form>
        </div>
    );
}
