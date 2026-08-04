export default function StatusBadge({ active }) {
    return (
        <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
            }`}
        >
            {active ? "Active" : "Inactive"}
        </span>
    );
}
