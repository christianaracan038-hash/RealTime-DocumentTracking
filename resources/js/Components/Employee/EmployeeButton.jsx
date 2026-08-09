export default function EmployeeButton({ children, className = "", ...props }) {
    return (
        <button
            {...props}
            className={`inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 ${className}`}
        >
            {children}
        </button>
    );
}
