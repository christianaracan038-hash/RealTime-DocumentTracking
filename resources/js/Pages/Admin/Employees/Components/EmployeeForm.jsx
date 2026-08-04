import FormCard from "./FormCard";
import InputError from "./InputError";

export default function EmployeeForm({
    form,
    sections,
    roles,
    handleChange,
    handleSubmit,
    errors,
}) {
    return (
        <FormCard
            title="Create Employee Account"
            description="Add a new employee with the right section and role."
            badge="Employee"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Username
                    </label>
                    <input
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        className={`w-full rounded-lg shadow-sm ${
                            errors.username
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                        }`}
                        required
                    />
                    <InputError message={errors.username} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className={`w-full rounded-lg shadow-sm ${
                                errors.password
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                    : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                            }`}
                            required
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Confirm Password
                        </label>

                        <input
                            type="password"
                            name="password_confirmation"
                            value={form.password_confirmation}
                            onChange={handleChange}
                            className={`w-full rounded-lg shadow-sm ${
                                errors.password_confirmation
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                    : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                            }`}
                            required
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Section
                        </label>

                        <select
                            name="section_id"
                            value={form.section_id}
                            onChange={handleChange}
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        >
                            <option value="">Select section</option>

                            {sections.map((section) => (
                                <option
                                    key={section.section_id}
                                    value={section.section_id}
                                >
                                    {section.section_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Role
                        </label>

                        <select
                            name="role_id"
                            value={form.role_id}
                            onChange={handleChange}
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        >
                            <option value="">Select role</option>

                            {roles.map((role) => (
                                <option key={role.role_id} value={role.role_id}>
                                    {role.role_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleChange}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Active account
                </label>

                <button
                    type="submit"
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                    Create Account
                </button>
            </form>
        </FormCard>
    );
}
