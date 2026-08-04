import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import { useState } from "react";
import RoleForm from "./Components/RoleForm";
import RoleTable from "./Components/RoleTable";

export default function Roles() {
    const { roles, flash } = usePage().props;
    const [form, setForm] = useState({
        role_name: "",
        description: "",
        is_active: true,
    });

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        router.post(route("roles.store"), form, {
            onSuccess: () => {
                setForm({
                    role_name: "",
                    description: "",
                    is_active: true,
                });
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-slate-900">
                            Roles
                        </h2>
                        <p className="text-sm text-slate-500">
                            Manage access roles for your employee accounts.
                        </p>
                    </div>
                    <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                        {roles.length} roles
                    </div>
                </div>
            }
        >
            <Head title="Roles" />

            <div className="bg-slate-50 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {flash.success}
                        </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                        <RoleForm
                            form={form}
                            handleChange={handleChange}
                            handleSubmit={handleSubmit}
                        />

                        <RoleTable roles={roles} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
