/*
 * The two office logos, side by side.
 *
 * Files live in public/images/ and are referenced by fixed name:
 *
 *   /images/bir-logo.png     the bureau seal (also printed on the slip)
 *   /images/office-logo.png  the district office's own logo
 *
 * A file that is not there simply does not render - no broken-image
 * icon - so the page looks right before and after the files arrive.
 */

const LOGOS = [
    { src: "/images/bir-logo.png", alt: "Bureau of Internal Revenue" },
    { src: "/images/office-logo.png", alt: "Revenue District Office" },
];

const SIZES = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-20 w-20",
};

export default function Logos({ size = "md", className = "" }) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {LOGOS.map(({ src, alt }) => (
                <img
                    key={src}
                    src={src}
                    alt={alt}
                    className={`${SIZES[size] ?? SIZES.md} shrink-0 object-contain`}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                />
            ))}
        </div>
    );
}
