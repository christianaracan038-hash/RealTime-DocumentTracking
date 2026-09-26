import { useEffect, useRef, useState } from "react";
import { router, useForm } from "@inertiajs/react";

import AdminModal from "../../Components/AdminModal";
import Avatar from "@/Components/Employee/Avatar";

/*
 * Putting a face to an account.
 *
 * Shows what is chosen before it is sent, because the photo is squared
 * off from the centre on the server and somebody should see what that is
 * going to cut off before it happens.
 */
export default function PhotoModal({ open, onClose, employee }) {
    const [preview, setPreview] = useState(null);

    const fileInput = useRef(null);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({ photo: null });

    useEffect(() => {
        if (!open) return;

        reset();
        clearErrors();
        setPreview(null);
    }, [open, employee?.employee_id]);

    // A preview is an object URL, and object URLs have to be released.
    useEffect(() => {
        return () => preview && URL.revokeObjectURL(preview);
    }, [preview]);

    if (!employee) return null;

    const choose = (event) => {
        const file = event.target.files?.[0] ?? null;

        setData("photo", file);

        setPreview((old) => {
            if (old) URL.revokeObjectURL(old);

            return file ? URL.createObjectURL(file) : null;
        });
    };

    const submit = (event) => {
        event.preventDefault();

        post(route("super.employees.photo", employee.employee_id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                reset();
                setPreview(null);
                onClose();
            },
        });
    };

    const removePhoto = () => {
        if (!window.confirm("Remove this photograph?")) return;

        router.delete(
            route("super.employees.photo.destroy", employee.employee_id),
            {
                preserveScroll: true,
                onSuccess: onClose,
            },
        );
    };

    return (
        <AdminModal
            open={open}
            onClose={onClose}
            busy={processing}
            title="Photograph"
            description={employee.display_name}
        >
            <form onSubmit={submit} className="space-y-5">
                <div className="flex items-center gap-4">
                    <Avatar
                        url={preview ?? employee.avatar_url}
                        name={employee.display_name}
                        size="lg"
                    />

                    <div className="min-w-0 text-sm text-slate-500">
                        <p>
                            Cropped to a square from the centre and shrunk to
                            256 pixels.
                        </p>

                        <p className="mt-1">JPEG, PNG or WebP, up to 8MB.</p>
                    </div>
                </div>

                <div>
                    <input
                        ref={fileInput}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={choose}
                        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                    />

                    {errors.photo && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.photo}
                        </p>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
                    {employee.avatar_url ? (
                        <button
                            type="button"
                            onClick={removePhoto}
                            disabled={processing}
                            className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                        >
                            Remove photograph
                        </button>
                    ) : (
                        <span />
                    )}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
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
                            disabled={processing || !data.photo}
                            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {processing ? "Uploading..." : "Save photograph"}
                        </button>
                    </div>
                </div>
            </form>
        </AdminModal>
    );
}
