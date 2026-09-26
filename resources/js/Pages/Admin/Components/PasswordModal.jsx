import { useEffect } from "react";
import { useForm } from "@inertiajs/react";

import AdminModal from "./AdminModal";
import Field, { INPUT, INPUT_ERROR } from "./Field";

/*
 * Setting a new password for somebody who has forgotten theirs.
 *
 * Its own action rather than a field on the edit form: changing a
 * password should never happen as a side effect of correcting the
 * spelling of a name. Nothing shows the old one - it is hashed and
 * unreadable to everybody, administrators included.
 */
export default function PasswordModal({ open, onClose, account, action }) {
    const { data, setData, patch, processing, errors, reset, clearErrors } =
        useForm({
            password: "",
            password_confirmation: "",
        });

    useEffect(() => {
        if (open) {
            reset();
            clearErrors();
        }
    }, [open, account?.id, account?.employee_id]);

    if (!account) return null;

    const submit = (e) => {
        e.preventDefault();

        patch(action, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <AdminModal
            open={open}
            onClose={onClose}
            busy={processing}
            title="Set a new password"
            description={`For ${account.display_name ?? account.name ?? account.username}. Tell them the new one in person.`}
        >
            <form onSubmit={submit} className="space-y-4">
                <Field label="New password" required error={errors.password}>
                    <input
                        type="password"
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        autoFocus
                        autoComplete="new-password"
                        className={errors.password ? INPUT_ERROR : INPUT}
                    />
                </Field>

                <Field
                    label="Confirm new password"
                    required
                    error={errors.password_confirmation}
                >
                    <input
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData("password_confirmation", e.target.value)
                        }
                        autoComplete="new-password"
                        className={
                            errors.password_confirmation ? INPUT_ERROR : INPUT
                        }
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
                        {processing ? "Saving..." : "Set password"}
                    </button>
                </div>
            </form>
        </AdminModal>
    );
}
