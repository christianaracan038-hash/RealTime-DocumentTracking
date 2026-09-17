import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";

import Icon from "./Icon";

/**
 * Debounced, server-side search box.
 *
 * Pushes the keyword to the current route as a query string so the
 * database performs the filtering before pagination. Without this the
 * search would only ever see the rows on the page already rendered.
 */
export default function SearchInput({
    initialValue = "",
    label = "Search",
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
        <div>
            <label className="mb-1.5 block text-sm font-semibold text-navy-800">
                {label}
            </label>

            <div className="relative">
                <Icon
                    name="search"
                    className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
                />

                <input
                    type="search"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pr-11 pl-11 text-base text-navy-900 placeholder:text-muted focus:border-brand-600"
                />

                {value && (
                    <button
                        type="button"
                        onClick={() => setValue("")}
                        className="absolute inset-y-0 right-0 px-4 leading-none text-muted transition hover:text-navy-900"
                        aria-label="Clear search"
                    >
                        <Icon name="close" />
                    </button>
                )}
            </div>
        </div>
    );
}
