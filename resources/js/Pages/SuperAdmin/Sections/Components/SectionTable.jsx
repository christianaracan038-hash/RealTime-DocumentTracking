import StatusBadge from "@/Components/Common/StatusBadge";

export default function SectionTable({ sections }) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold">
                            Code
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                            Section
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                            Description
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                            Status
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                    {sections.map((section) => (
                        <tr key={section.section_id}>
                            <td className="px-4 py-3 font-medium">
                                {section.section_code}
                            </td>

                            <td className="px-4 py-3">
                                {section.section_name}
                            </td>

                            <td className="px-4 py-3">
                                {section.description || "—"}
                            </td>

                            <td className="px-4 py-3">
                                <StatusBadge active={section.is_active} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
