export default function EmployeeTable({ headers, children }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {headers.map((header) => (
                            <th
                                key={header}
                                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                    {children}
                </tbody>
            </table>
        </div>
    );
}
