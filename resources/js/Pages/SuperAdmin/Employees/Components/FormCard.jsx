export default function FormCard({ title, description, badge, children }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                        {title}
                    </h3>

                    <p className="text-sm text-slate-500">{description}</p>
                </div>

                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    {badge}
                </div>
            </div>

            {children}
        </div>
    );
}
