export default function Card({ children }) {
    return (
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            {children}
        </div>
    );
}
