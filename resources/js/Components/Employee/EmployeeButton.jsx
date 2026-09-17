/*
 * The one button in the employee portal.
 *
 * Sized for people who are not mousing precisely: every variant is at
 * least 44px tall with a real label, never an icon on its own.
 *
 *   primary    the action this screen exists for. One per screen.
 *   secondary  a real but lesser action.
 *   quiet      cancel, close, go back.
 *   danger     destructive, and rare.
 *   accent     the primary action when the surface is navy.
 */

const VARIANTS = {
    primary:
        "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-700",
    secondary:
        "bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100",
    quiet: "bg-white text-navy-800 border border-line hover:bg-paper",
    danger: "bg-stop-600 text-white hover:brightness-110",

    /*
     * For a button sitting on navy, where the brand blue would vanish.
     * The attention yellow with navy text - the one thing to press on
     * that surface.
     */
    accent: "bg-accent-400 text-navy-900 shadow-sm hover:bg-accent-500 active:bg-accent-600",
};

const SIZES = {
    md: "min-h-11 px-5 py-2.5 text-base",
    lg: "min-h-13 px-7 py-3 text-lg",
};

export default function EmployeeButton({
    children,
    variant = "primary",
    size = "md",
    className = "",
    ...props
}) {
    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                VARIANTS[variant] ?? VARIANTS.primary
            } ${SIZES[size] ?? SIZES.md} ${className}`}
        >
            {children}
        </button>
    );
}
