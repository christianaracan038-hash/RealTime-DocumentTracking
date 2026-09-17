import { usePage } from "@inertiajs/react";

/*
 * The office logos, side by side.
 *
 * Which files exist is decided on the server (HandleInertiaRequests),
 * so a logo that has not been uploaded yet is never requested and the
 * browser console stays clean. Drop the files in as:
 *
 *   public/images/bir-logo.png     the bureau seal (also on the slip)
 *   public/images/office-logo.png  the district office's own logo
 */

const ALT = {
    bir: "Bureau of Internal Revenue",
    office: "Bagong Pilipinas",
};

const SIZES = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-20 w-20",
};

export default function Logos({ size = "md", className = "" }) {
    const { logos } = usePage().props;

    const available = Object.entries(logos ?? {});

    if (available.length === 0) return null;

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {available.map(([key, src]) => (
                <img
                    key={key}
                    src={src}
                    alt={ALT[key] ?? ""}
                    className={`${SIZES[size] ?? SIZES.md} shrink-0 object-contain`}
                />
            ))}
        </div>
    );
}
