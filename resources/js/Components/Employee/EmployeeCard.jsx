/*
 * A panel. White on the tinted page, with a hairline border and a soft
 * shadow so it reads as a sheet lying on the page rather than part of it.
 */
export default function EmployeeCard({ children, className = "" }) {
    return (
        <div
            className={`rounded-2xl border border-line bg-white p-6 shadow-sm shadow-navy-900/5 ${className}`}
        >
            {children}
        </div>
    );
}
