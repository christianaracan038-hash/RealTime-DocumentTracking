import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";

import Icon from "./Icon";

export default function SearchInput({
    initialValue = "",
    label = "Search",
    placeholder = "Search...",
    hint = null,
    size = "md",
    only = ["documents", "filters"],
}) {
    const [value, setValue] = useState(initialValue ?? "");

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
                className={`block font-semibold text-black ${
                    large ? "mb-2 text-lg" : "mb-1.5 text-sm"
                }`}
            >
                {label}
            </label>

            <div className="relative">
                <Icon
                    name="search"
                    className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-black ${
                        large ? "left-5 text-xl" : "left-4"
                    }`}
                />

                <input
                    id="employee-search"
                    type="search"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full bg-white text-black placeholder:text-black/50 ${
                        large
                            ? "min-h-14 rounded-xl border-2 border-brand-200 py-3 pr-12 pl-14 text-lg focus:border-brand-600"
                            : "min-h-11 rounded-xl border border-line py-2.5 pr-11 pl-11 text-base focus:border-brand-600"
                    }`}
                />

                {value && (
                    <button
                        type="button"
                        onClick={() => setValue("")}
                        className={`absolute inset-y-0 right-0 leading-none text-black transition hover:opacity-70 ${
                            large ? "px-5 text-lg" : "px-4"
                        }`}
                        aria-label="Clear search"
                    >
                        <Icon name="close" />
                    </button>
                )}
            </div>

            {hint && <p className="mt-2 text-base text-black">{hint}</p>}
        </div>
    );
}
