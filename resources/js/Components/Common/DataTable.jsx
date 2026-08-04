export default function DataTable({ columns, data, renderActions }) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className="px-5 py-3 text-left text-sm font-semibold text-slate-700"
                            >
                                {column.label}
                            </th>
                        ))}

                        {renderActions && (
                            <th className="px-5 py-3 text-center text-sm font-semibold text-slate-700">
                                Actions
                            </th>
                        )}
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                    {data.length > 0 ? (
                        data.map((row, index) => (
                            <tr
                                key={index}
                                className="hover:bg-slate-50 transition"
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className="px-5 py-4 text-sm text-slate-700"
                                    >
                                        {column.render
                                            ? column.render(row)
                                            : row[column.key]}
                                    </td>
                                ))}

                                {renderActions && (
                                    <td className="px-5 py-4 text-center">
                                        {renderActions(row)}
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={
                                    columns.length + (renderActions ? 1 : 0)
                                }
                                className="py-10 text-center text-slate-500"
                            >
                                No records found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
