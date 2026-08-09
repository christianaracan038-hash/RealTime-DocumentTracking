export default function EmployeePageHeader({ title, subtitle, action = null }) {
    return (
        <div className="mb-6 flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">{title}</h1>

                {subtitle && <p className="mt-1 text-gray-500">{subtitle}</p>}
            </div>

            {action}
        </div>
    );
}
