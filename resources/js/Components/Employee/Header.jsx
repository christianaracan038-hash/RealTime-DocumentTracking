export default function Header({ title }) {
    return (
        <header className="border-b bg-white px-6 py-4 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">
                {title ?? "Employee Portal"}
            </h1>
        </header>
    );
}
