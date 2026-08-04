import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import { useState } from "react";
import EmployeeForm from "./Components/EmployeeForm";
import EmployeeTable from "./Components/EmployeeTable";

const createEmployeeForm = () => ({
    username: "",
    password: "",
    password_confirmation: "",
    section_id: "",
    role_id: "",
    is_active: true,
});

function FormCard({ title, description, badge, children }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    {badge}
                </div>
            </div>
            {children}
        </div>
    );
}

export default function Dashboard() {
    const { employees, sections, roles, flash, errors } = usePage().props;
    const [employeeForm, setEmployeeForm] = useState(createEmployeeForm);
    const [feedback, setFeedback] = useState(null);

    const handleFieldChange = (setter) => (event) => {
        const { name, value, type, checked } = event.target;
        setter((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        console.log("handleSubmit");

        router.post(route("admin.employees.store"), employeeForm, {
            onSuccess: () => {
                setEmployeeForm(createEmployeeForm());
                setFeedback(null);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-slate-900">
                            Admin Management
                        </h2>
                        <p className="text-sm text-slate-500">
                            Create and manage employee accounts, sections, and
                            roles from one clean dashboard.
                        </p>
                    </div>
                    <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                        {employees.length} active accounts
                    </div>
                </div>
            }
        >
            <Head title="Admin Management" />

            <div className="bg-slate-50 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {flash.success}
                        </div>
                    )}

                    {feedback && (
                        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {feedback.message}
                        </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                        <EmployeeForm
                            form={employeeForm}
                            sections={sections}
                            roles={roles}
                            errors={errors}
                            handleChange={handleFieldChange(setEmployeeForm)}
                            handleSubmit={handleSubmit}
                        />

                        <EmployeeTable employees={employees} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
