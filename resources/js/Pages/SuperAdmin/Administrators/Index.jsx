import { useEffect, useState } from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import FormCard from "../Employees/Components/FormCard";
import AdminModal from "../Components/AdminModal";
import PasswordModal from "../Components/PasswordModal";
import Field, { INPUT, INPUT_ERROR } from "../Components/Field";

/*
 * The administrator accounts themselves.
 *
 * One tier: the office holds an account and so do the developers, and
 * every one of them can manage the others. That is right for an office
 * this size, and it is also how a live system ends up with nobody able to
 * administer it - so the server refuses to switch off your own account,
 * or the last active one.
 *
 * Switching off is how the developers hand over: their accounts stop
 * working without being deleted, which keeps whatever they did
 * attributable.
 */

function EditModal({ open, onClose, administrator }) {
    const { data, setData, patch, processing, errors, clearErrors } = useForm({
        name: "",
        email: "",
    });

    useEffect(() => {
        if (!open || !administrator) return;

        clearErrors();

        setData({
            name: administrator.name ?? "",
            email: administrator.email ?? "",
        });
    }, [open, administrator?.id]);

    if (!administrator) return null;

    const submit = (e) => {
        e.preventDefault();

        patch(route("super.administrators.update", administrator.id), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <AdminModal
            open={open}
            onClose={onClose}
            busy={processing}
            title="Edit administrator"
        >
            <form onSubmit={submit} className="space-y-4">
                <Field label="Name" required error={errors.name}>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        autoFocus
                        className={errors.name ? INPUT_ERROR : INPUT}
                    />
                </Field>

                <Field
                    label="Email"
                    required
                    hint="Administrators sign in with their email address."
                    error={errors.email}
                >
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        className={errors.email ? INPUT_ERROR : INPUT}
                    />
                </Field>

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

export default function Index() {
    const { administrators, currentId, flash, errors } = usePage().props;

    const [editing, setEditing] = useState(null);
    const [changingPassword, setChangingPassword] = useState(null);

    const createForm = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const submit = (e) => {
        e.preventDefault();

        createForm.post(route("super.administrators.store"), {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    };

    const setActive = (administrator, isActive) => {
        const verb = isActive
            ? "be able to sign in again"
            : "no longer be able to sign in";

        if (!window.confirm(`${administrator.name} will ${verb}.`)) return;

        router.patch(
            route("super.administrators.active", administrator.id),
            { is_active: isActive },
            { preserveScroll: true },
        );
    };

    const activeCount = administrators.filter((a) => a.is_active).length;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-slate-900">
                            Administrators
                        </h2>

                        <p className="text-sm text-slate-500">
                            Who can manage accounts, sections and roles.
                        </p>
                    </div>

                    <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                        {activeCount} active
                    </div>
                </div>
            }
        >
            <Head title="Administrators" />

            <div className="bg-slate-50 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {flash.success}
                        </div>
                    )}

                    {/* A refused deactivation lands here, not in a modal */}
                    {errors?.is_active && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errors.is_active}
                        </div>
                    )}

                    {activeCount === 1 && (
                        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            There is only one active administrator. If that
                            password is lost, nobody can create accounts or
                            reset anyone else. Add a second one.
                        </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                        <FormCard
                            title="Add an administrator"
                            description="They sign in with an email address, unlike employees."
                            badge="Administrator"
                        >
                            <form onSubmit={submit} className="space-y-4">
                                <Field
                                    label="Name"
                                    required
                                    error={createForm.errors.name}
                                >
                                    <input
                                        type="text"
                                        value={createForm.data.name}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "name",
                                                e.target.value,
                                            )
                                        }
                                        className={
                                            createForm.errors.name
                                                ? INPUT_ERROR
                                                : INPUT
                                        }
                                    />
                                </Field>

                                <Field
                                    label="Email"
                                    required
                                    error={createForm.errors.email}
                                >
                                    <input
                                        type="email"
                                        value={createForm.data.email}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "email",
                                                e.target.value,
                                            )
                                        }
                                        className={
                                            createForm.errors.email
                                                ? INPUT_ERROR
                                                : INPUT
                                        }
                                    />
                                </Field>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field
                                        label="Password"
                                        required
                                        error={createForm.errors.password}
                                    >
                                        <input
                                            type="password"
                                            value={createForm.data.password}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "password",
                                                    e.target.value,
                                                )
                                            }
                                            autoComplete="new-password"
                                            className={
                                                createForm.errors.password
                                                    ? INPUT_ERROR
                                                    : INPUT
                                            }
                                        />
                                    </Field>

                                    <Field
                                        label="Confirm"
                                        required
                                        error={
                                            createForm.errors
                                                .password_confirmation
                                        }
                                    >
                                        <input
                                            type="password"
                                            value={
                                                createForm.data
                                                    .password_confirmation
                                            }
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "password_confirmation",
                                                    e.target.value,
                                                )
                                            }
                                            autoComplete="new-password"
                                            className={
                                                createForm.errors
                                                    .password_confirmation
                                                    ? INPUT_ERROR
                                                    : INPUT
                                            }
                                        />
                                    </Field>
                                </div>

                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {createForm.processing
                                        ? "Creating..."
                                        : "Add administrator"}
                                </button>
                            </form>
                        </FormCard>

                        <FormCard
                            title="Administrator accounts"
                            description="Switching one off is also how a developer's access ends at handover."
                            badge={`${administrators.length} total`}
                        >
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                                Administrator
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
                                        {administrators.map((administrator) => {
                                            const isMe =
                                                administrator.id === currentId;

                                            return (
                                                <tr
                                                    key={administrator.id}
                                                    className={
                                                        administrator.is_active
                                                            ? ""
                                                            : "bg-slate-50/70"
                                                    }
                                                >
                                                    <td className="px-4 py-3">
                                                        <p
                                                            className={`font-medium ${
                                                                administrator.is_active
                                                                    ? "text-slate-800"
                                                                    : "text-slate-500"
                                                            }`}
                                                        >
                                                            {administrator.name}

                                                            {isMe && (
                                                                <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                                                    You
                                                                </span>
                                                            )}
                                                        </p>

                                                        <p className="text-xs text-slate-500">
                                                            {
                                                                administrator.email
                                                            }
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                administrator.is_active
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : "bg-slate-200 text-slate-600"
                                                            }`}
                                                        >
                                                            {administrator.is_active
                                                                ? "Active"
                                                                : "Cannot sign in"}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setEditing(
                                                                        administrator,
                                                                    )
                                                                }
                                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setChangingPassword(
                                                                        administrator,
                                                                    )
                                                                }
                                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                                            >
                                                                Password
                                                            </button>

                                                            {/*
                                                             * Not offered on your own
                                                             * account - the server
                                                             * refuses it anyway.
                                                             */}
                                                            {!isMe && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setActive(
                                                                            administrator,
                                                                            !administrator.is_active,
                                                                        )
                                                                    }
                                                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                                                        administrator.is_active
                                                                            ? "border border-red-200 text-red-700 hover:bg-red-50"
                                                                            : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                                    }`}
                                                                >
                                                                    {administrator.is_active
                                                                        ? "Deactivate"
                                                                        : "Reactivate"}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </FormCard>
                    </div>
                </div>
            </div>

            <EditModal
                open={Boolean(editing)}
                onClose={() => setEditing(null)}
                administrator={editing}
            />

            <PasswordModal
                open={Boolean(changingPassword)}
                onClose={() => setChangingPassword(null)}
                account={changingPassword}
                action={
                    changingPassword
                        ? route(
                              "super.administrators.password",
                              changingPassword.id,
                          )
                        : ""
                }
            />
        </AuthenticatedLayout>
    );
}
