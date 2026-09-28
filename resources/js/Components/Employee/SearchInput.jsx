import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";

import Icon from "./Icon";

/**
 * Debounced, server-side search box.
 *
 * Pushes the keyword to the current route as a query string so the
 * database performs the filtering before pagination. Without this the
 * search would only ever see the rows on the page already rendered.
 *
 * `size="lg"` is for a screen where searching is the main way people
 * find things rather than a refinement of a list they are already
 * reading - it sits in its own tinted block, tall enough to hit with a
 * thumb and large enough to read a taxpayer's name back at arm's length.
 */
export default function SearchInput({
    initialValue = "",
    label = "Search",
    placeholder = "Search...",
    hint = null,
    size = "md",
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

    const large = size === "lg";

    return (
        <div
            className={
                large
                    ? "rounded-2xl border-2 border-brand-200 bg-brand-50 p-4 sm:p-5"
                    : ""
            }
        >
            <label
                htmlFor="employee-search"
                className={`block font-semibold text-navy-800 ${
                    large ? "mb-2 text-lg" : "mb-1.5 text-sm"
                }`}
            >
                {label}
            </label>

            <div className="relative">
                <Icon
                    name="search"
                    className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${
                        large
                            ? "left-5 text-xl text-brand-700"
                            : "left-4 text-muted"
                    }`}
                />

                <input
                    id="employee-search"
                    type="search"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full bg-white text-navy-900 placeholder:text-muted ${
                        large
                            ? "min-h-14 rounded-xl border-2 border-brand-200 py-3 pr-12 pl-14 text-lg focus:border-brand-600"
                            : "min-h-11 rounded-xl border border-line py-2.5 pr-11 pl-11 text-base focus:border-brand-600"
                    }`}
                />

                {value && (
                    <button
                        type="button"
                        onClick={() => setValue("")}
                        className={`absolute inset-y-0 right-0 leading-none text-muted transition hover:text-navy-900 ${
                            large ? "px-5 text-lg" : "px-4"
                        }`}
                        aria-label="Clear search"
                    >
                        <Icon name="close" />
                    </button>
                )}
            </div>

            {hint && <p className="mt-2 text-base text-navy-800">{hint}</p>}
        </div>
    );
}
