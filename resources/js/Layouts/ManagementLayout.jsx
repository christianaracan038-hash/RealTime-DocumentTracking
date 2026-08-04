export default function ManagementLayout({
    tableTitle,
    tableDescription,
    formTitle,
    formDescription,
    table,
    form,
    badge,
}) {
    return (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            {tableTitle}
                        </h3>

                        <p className="text-sm text-slate-500">
                            {tableDescription}
                        </p>
                    </div>

                    {badge && (
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                            {badge}
                        </div>
                    )}
                </div>

                {table}
            </div>

            {/* Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                    <h3 className="text-lg font-semibold text-slate-900">
                        {formTitle}
                    </h3>

                    <p className="text-sm text-slate-500">{formDescription}</p>
                </div>

                {form}
            </div>
        </div>
    );
}
