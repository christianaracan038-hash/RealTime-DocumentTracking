export default function PageHeader({ title, description, badge }) {
    return (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
                <h2 className="text-xl font-semibold text-slate-900">
                    {title}
                </h2>

                <p className="text-sm text-slate-500">{description}</p>
            </div>

            {badge && (
                <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                    {badge}
                </div>
            )}
        </div>
    );
}
