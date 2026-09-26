/*
 * One labelled input, with its error underneath.
 *
 * The error border is on the field itself rather than only in the text,
 * so somebody scanning a form of eight inputs can see which one it is
 * talking about.
 */

export const INPUT =
    "w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500";

export const INPUT_ERROR =
    "w-full rounded-lg border-red-500 shadow-sm focus:border-red-500 focus:ring-red-500";

export default function Field({ label, hint, error, required, children }) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
                {label}
                {!required && (
                    <span className="ml-1 font-normal text-slate-400">
                        (optional)
                    </span>
                )}
            </label>

            {children}

            {hint && !error && (
                <p className="mt-1 text-xs text-slate-500">{hint}</p>
            )}

            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
