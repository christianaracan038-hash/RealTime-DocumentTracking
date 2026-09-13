/*
 * A panel. Border and white ground only - no shadow stacking, so the
 * page reads as a set of calm blocks rather than floating tiles.
 */
export default function EmployeeCard({ children, className = "" }) {
    return (
        <div
            className={`rounded-2xl border border-line bg-white p-6 ${className}`}
        >
            {children}
        </div>
    );
}
