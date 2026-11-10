import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import { useState } from "react";

const emptyForm = {
    section_code: "",
    section_name: "",
    description: "",
    is_active: true,
};

export default function Sections() {
    const { sections, flash, errors } = usePage().props;
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [processing, setProcessing] = useState(false);

    const keyOf = (section) => section.section_code;

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const startEdit = (section) => {
        setEditing(keyOf(section));
        setForm({
            section_code: section.section_code,
            section_name: section.section_name,
            description: section.description || "",
            is_active: !!section.is_active,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEdit = () => {
        setEditing(null);
        setForm(emptyForm);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);

        const options = {
            preserveScroll: true,
            onSuccess: () => cancelEdit(),
            onFinish: () => setProcessing(false),
        };

        if (editing) {
            router.put(route("super.sections.update", editing), form, options);
        } else {
            router.post(route("super.sections.store"), form, options);
        }
    };

    const confirmDelete = () => {
        router.delete(route("super.sections.destroy", keyOf(deleting)), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-slate-900">
                            Sections
                        </h2>
                        <p className="text-sm text-slate-500">
                            Manage the organization sections for your documents
                            and staff.
                        </p>
                    </div>
                    <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                        {sections.length} sections
                    </div>
                </div>
            }
        >
            <Head title="Sections" />

            <div className="bg-slate-50 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {flash.success}
                        </div>
                    )}

                    {errors?.delete && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errors.delete}
                        </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {editing
                                        ? "Edit Section"
                                        : "Create Section"}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {editing
                                        ? "Update the details of this section."
                                        : "Add a new section to keep your teams and documents organized."}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Section Code
                                    </label>
                                    <input
                                        type="text"
                                        name="section_code"
                                        value={form.section_code}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    />
                                    {errors?.section_code && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.section_code}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Section Name
                                    </label>
                                    <input
                                        type="text"
                                        name="section_name"
                                        value={form.section_name}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    />
                                    {errors?.section_name && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.section_name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        rows="3"
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
                                    Active section
                                </label>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                                    >
                                        {editing
                                            ? "Save Changes"
                                            : "Create Section"}
                                    </button>
                                    {editing && (
                                        <button
                                            type="button"
                                            onClick={cancelEdit}
                                            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        Section List
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Review the sections currently available.
                                    </p>
                                </div>
                                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                                    Management
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                                Code
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                                Name
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                                Description
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
                                        {sections.map((section) => (
                                            <tr
                                                key={keyOf(section)}
                                                className={
                                                    editing === keyOf(section)
                                                        ? "bg-indigo-50/60"
                                                        : ""
                                                }
                                            >
                                                <td className="px-4 py-3 font-medium text-slate-800">
                                                    {section.section_code}
                                                </td>
                                                <td className="px-4 py-3 text-slate-700">
                                                    {section.section_name}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {section.description || "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${section.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                                                    >
                                                        {section.is_active
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            startEdit(section)
                                                        }
                                                        className="rounded-md px-2.5 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDeleting(section)
                                                        }
                                                        className="rounded-md px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {deleting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Delete section?
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                            You are about to delete{" "}
                            <span className="font-semibold">
                                {deleting.section_name}
                            </span>
                            . This cannot be undone.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleting(null)}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
