export default function EmployeePageHeader({ title, subtitle, action = null }) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">
                    {title}
                </h1>

                {subtitle && (
                    <p className="mt-1 text-base text-muted">{subtitle}</p>
                )}
            </div>

            {action && (
                <div className="[&>*]:w-full sm:[&>*]:w-auto">{action}</div>
            )}
        </div>
    );
}
