import { useEffect } from "react";

/*
 * The dialog shell used by every account action in the admin area.
 *
 * Kept deliberately plain: these are one-job forms - correct a name, set
 * a password - and the administrator should be able to see the whole of
 * one without scrolling.
 */
export default function AdminModal({
    open,
    onClose,
    title,
    description,
    children,
    busy = false,
}) {
    useEffect(() => {
        if (!open) return;

        const onKey = (e) => e.key === "Escape" && !busy && onClose();

        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [open, busy, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 sm:items-center">
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            {title}
                        </h3>

                        {description && (
                            <p className="mt-0.5 text-sm text-slate-500">
                                {description}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close"
                        className="-me-2 -mt-1 rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                        &times;
                    </button>
                </div>

                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}
