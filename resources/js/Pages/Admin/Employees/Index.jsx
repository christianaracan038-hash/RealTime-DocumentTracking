import { useEffect, useRef, useState } from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import EmployeeForm from "./Components/EmployeeForm";
import EmployeeTable from "./Components/EmployeeTable";
import EditEmployeeModal from "./Components/EditEmployeeModal";
import PasswordModal from "../Components/PasswordModal";

/*
 * Employee accounts.
 *
 * Creating one was all this page could do. An account could not be
 * corrected, switched off, or given a new password - so a forgotten
 * password had no remedy at all, and somebody who left the office kept
 * their access.
 */
export default function Index() {
    const { employees, sections, roles, filters, flash } = usePage().props;

    const [editing, setEditing] = useState(null);
    const [changingPassword, setChangingPassword] = useState(null);
    const [search, setSearch] = useState(filters?.search ?? "");

    const createForm = useForm({
        username: "",
        full_name: "",
        position: "",
        email: "",
        password: "",
        password_confirmation: "",
        section_id: "",
        role_id: "",
        is_active: true,
    });

    // Search runs in the database, so a match is found whatever it matches on.
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;

            return;
        }

        const timer = setTimeout(() => {
            router.get(
                route("admin.dashboard"),
                { search: search || undefined },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const handleFieldChange = (event) => {
        const { name, value, type, checked } = event.target;

        createForm.setData(name, type === "checkbox" ? checked : value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        createForm.post(route("admin.employees.store"), {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    };

    const setActive = (employee, isActive) => {
        const verb = isActive ? "let back in" : "stop from signing in";

        if (!window.confirm(`${employee.display_name} will be ${verb}.`)) {
            return;
        }

        router.patch(
            route("admin.employees.active", employee.employee_id),
            { is_active: isActive },
            { preserveScroll: true },
        );
    };

    const withoutName = employees.filter((e) => !e.full_name).length;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-slate-900">
                            Employee Accounts
                        </h2>

                        <p className="text-sm text-slate-500">
                            Who works here, what they can reach, and whether
                            they can sign in.
                        </p>
                    </div>

                    <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                        {employees.filter((e) => e.is_active).length} active
                    </div>
                </div>
            }
        >
            <Head title="Employee Accounts" />

            <div className="bg-slate-50 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {flash.success}
                        </div>
                    )}

                    {/*
                     * The accounts that predate the name columns. Every
                     * screen naming a person falls back to their username
                     * until somebody fills these in.
                     */}
                    {withoutName > 0 && (
                        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            <strong>{withoutName}</strong> account
                            {withoutName === 1 ? " has" : "s have"} no name on
                            file, so the system still shows a username where it
                            should show a person. Edit each one to add it.
                        </div>
                    )}

                    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                        <EmployeeForm
                            form={createForm.data}
                            sections={sections}
                            roles={roles}
                            errors={createForm.errors}
                            processing={createForm.processing}
                            handleChange={handleFieldChange}
                            handleSubmit={handleSubmit}
                        />

                        <EmployeeTable
                            employees={employees}
                            search={search}
                            onSearch={setSearch}
                            onEdit={setEditing}
                            onResetPassword={setChangingPassword}
                            onSetActive={setActive}
                        />
                    </div>
                </div>
            </div>

            <EditEmployeeModal
                open={Boolean(editing)}
                onClose={() => setEditing(null)}
                employee={editing}
                sections={sections}
                roles={roles}
            />

            <PasswordModal
                open={Boolean(changingPassword)}
                onClose={() => setChangingPassword(null)}
                account={changingPassword}
                action={
                    changingPassword
                        ? route(
                              "admin.employees.password",
                              changingPassword.employee_id,
                          )
                        : ""
                }
            />
        </AuthenticatedLayout>
    );
}
