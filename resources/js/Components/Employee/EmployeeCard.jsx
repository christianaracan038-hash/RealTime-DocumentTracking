/*
 * A panel. Off-white on the tinted page, with a hairline border and a
 * soft shadow so it reads as a sheet lying on the page rather than part
 * of it.
 *
 * Not pure white: a screen of full-brightness panels is tiring to work in
 * all day, and against the old near-white page they did not read as
 * separate sheets at all.
 */
export default function EmployeeCard({ children, className = "" }) {
    return (
        <div
            className={`rounded-2xl border border-line bg-surface p-6 shadow-sm shadow-navy-900/5 ${className}`}
        >
            {children}
        </div>
    );
}
