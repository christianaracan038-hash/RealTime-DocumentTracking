import { useEffect } from "react";
import { useForm } from "@inertiajs/react";

import AdminModal from "../../Components/AdminModal";
import Field, { INPUT, INPUT_ERROR } from "../../Components/Field";

/*
 * Correcting an employee account.
 *
 * No password field - that is its own action, so nobody changes
 * somebody's password by accident while fixing a spelling.
 *
 * A full name is required here as well as on create, which is how the
 * nine accounts that predate the name columns acquire one: the first time
 * anybody edits them, they have to be named.
 */
export default function EditEmployeeModal({
    open,
    onClose,
    employee,
    sections = [],
    roles = [],
}) {
    const { data, setData, patch, processing, errors, clearErrors } = useForm({
        username: "",
        full_name: "",
        position: "",
        email: "",
        section_id: "",
        role_id: "",
    });

    useEffect(() => {
        if (!open || !employee) return;

        clearErrors();

        setData({
            username: employee.username ?? "",
            full_name: employee.full_name ?? "",
            position: employee.position ?? "",
            email: employee.email ?? "",
            section_id: employee.section_id ?? "",
            role_id: employee.role_id ?? "",
        });
    }, [open, employee?.employee_id]);

    if (!employee) return null;

    const submit = (e) => {
        e.preventDefault();

        patch(route("super.employees.update", employee.employee_id), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <AdminModal
            open={open}
            onClose={onClose}
            busy={processing}
            title="Edit account"
            description={`Signing in as ${employee.username}`}
        >
            <form onSubmit={submit} className="space-y-4">
                <Field label="Full name" required error={errors.full_name}>
                    <input
                        type="text"
                        value={data.full_name}
                        onChange={(e) => setData("full_name", e.target.value)}
                        autoFocus
                        className={errors.full_name ? INPUT_ERROR : INPUT}
                    />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Position" error={errors.position}>
                        <input
                            type="text"
                            value={data.position}
                            onChange={(e) =>
                                setData("position", e.target.value)
                            }
                            placeholder="Atty. / Chief"
                            className={errors.position ? INPUT_ERROR : INPUT}
                        />
                    </Field>

                    <Field label="Email" error={errors.email}>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            className={errors.email ? INPUT_ERROR : INPUT}
                        />
                    </Field>
                </div>

                <Field
                    label="Username"
                    required
                    hint="Changing this changes what they type to sign in."
                    error={errors.username}
                >
                    <input
                        type="text"
                        value={data.username}
                        onChange={(e) => setData("username", e.target.value)}
                        className={errors.username ? INPUT_ERROR : INPUT}
                    />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Section" required error={errors.section_id}>
                        <select
                            value={data.section_id}
                            onChange={(e) =>
                                setData("section_id", e.target.value)
                            }
                            className={errors.section_id ? INPUT_ERROR : INPUT}
                        >
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
                            value={data.role_id}
                            onChange={(e) => setData("role_id", e.target.value)}
                            className={errors.role_id ? INPUT_ERROR : INPUT}
                        >
                            {roles.map((role) => (
                                <option key={role.role_id} value={role.role_id}>
                                    {role.role_name}
                                    {role.is_active ? "" : " (inactive)"}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {processing ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </form>
        </AdminModal>
    );
}
