import FormCard from "./FormCard";
import Field, { INPUT, INPUT_ERROR } from "../../Components/Field";

/*
 * Creating an employee account.
 *
 * The identity fields come first and the sign-in details second, because
 * the administrator is looking at a person, not at a row in a table. A
 * full name is required: every screen that used to say "rdo.staff" - the
 * movement trail, a comment from the RDO, the audit log - reads off this.
 *
 * The position is the person's title in the office ("Atty.", "Chief").
 * It is not the referral's addressee: the printed BIR slip keeps its own
 * fixed list, so no individual's name leaves the office on paper.
 */
export default function EmployeeForm({
    form,
    sections,
    roles,
    handleChange,
    handleSubmit,
    processing = false,
    errors = {},
}) {
    return (
        <FormCard
            title="Create Employee Account"
            description="Who they are, and how they sign in."
            badge="Employee"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Full name" required error={errors.full_name}>
                    <input
                        type="text"
                        name="full_name"
                        value={form.full_name}
                        onChange={handleChange}
                        placeholder="e.g. John Dela Cruz"
                        className={errors.full_name ? INPUT_ERROR : INPUT}
                    />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                        label="Position"
                        hint="Shown before the name, e.g. Atty. John Dela Cruz"
                        error={errors.position}
                    >
                        <input
                            type="text"
                            name="position"
                            value={form.position}
                            onChange={handleChange}
                            placeholder="Atty. / Chief / Revenue Officer II"
                            className={errors.position ? INPUT_ERROR : INPUT}
                        />
                    </Field>

                    <Field
                        label="Email"
                        hint="For password resets later. Not used to sign in."
                        error={errors.email}
                    >
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className={errors.email ? INPUT_ERROR : INPUT}
                        />
                    </Field>
                </div>

                <div className="border-t border-slate-200 pt-4">
                    <Field
                        label="Username"
                        required
                        hint="What they type to sign in."
                        error={errors.username}
                    >
                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="e.g. rdo.staff"
                            className={errors.username ? INPUT_ERROR : INPUT}
                        />
                    </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                        label="First password"
                        required
                        error={errors.password}
                    >
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            className={errors.password ? INPUT_ERROR : INPUT}
                        />
                    </Field>

                    <Field
                        label="Confirm password"
                        required
                        error={errors.password_confirmation}
                    >
                        <input
                            type="password"
                            name="password_confirmation"
                            value={form.password_confirmation}
                            onChange={handleChange}
                            autoComplete="new-password"
                            className={
                                errors.password_confirmation
                                    ? INPUT_ERROR
                                    : INPUT
                            }
                        />
                    </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Section" required error={errors.section_id}>
                        <select
                            name="section_id"
                            value={form.section_id}
                            onChange={handleChange}
                            className={errors.section_id ? INPUT_ERROR : INPUT}
                        >
                            <option value="">Select section</option>

                            {sections.map((section) => (
                                <option
                                    key={section.section_id}
                                    value={section.section_id}
                                >
                                    {section.section_name}
                                    {section.is_active ? "" : " (inactive)"}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Role" required error={errors.role_id}>
                        <select
                            name="role_id"
                            value={form.role_id}
                            onChange={handleChange}
                            className={errors.role_id ? INPUT_ERROR : INPUT}
                        >
                            <option value="">Select role</option>

                            {roles.map((role) => (
                                <option key={role.role_id} value={role.role_id}>
                                    {role.role_name}
                                    {role.is_active ? "" : " (inactive)"}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleChange}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Can sign in straight away
                </label>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                    {processing ? "Creating..." : "Create Account"}
                </button>
            </form>
        </FormCard>
    );
}
