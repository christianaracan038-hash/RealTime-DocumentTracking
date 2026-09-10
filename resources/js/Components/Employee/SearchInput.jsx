import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";

/**
 * Debounced, server-side search box.
 *
 * Pushes the keyword to the current route as a query string so the
 * database performs the filtering before pagination. Without this the
 * search would only ever see the rows on the page already rendered.
 */
export default function SearchInput({
    initialValue = "",
    placeholder = "Search...",
    only = ["documents", "filters"],
}) {
    const [value, setValue] = useState(initialValue ?? "");

    // Skip the request that would otherwise fire on first render.
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                window.location.pathname,
                value ? { search: value } : {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only,
                },
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [value]);

    return (
        <div className="relative">
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 focus:border-indigo-500 focus:ring-indigo-500"
            />

            {value && (
                <button
                    type="button"
                    onClick={() => setValue("")}
                    className="absolute inset-y-0 right-0 px-3 text-slate-400 transition hover:text-slate-600"
                    aria-label="Clear search"
                >
                    &times;
                </button>
            )}
        </div>
    );
}
