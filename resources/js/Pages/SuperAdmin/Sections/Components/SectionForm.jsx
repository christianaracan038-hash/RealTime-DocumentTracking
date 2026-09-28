export default function SectionForm({ form, handleChange, handleSubmit }) {
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="mb-1 block text-sm font-medium">
                    Section Code
                </label>

                <input
                    type="text"
                    name="section_code"
                    value={form.section_code}
                    onChange={handleChange}
                    className="w-full rounded-lg border-slate-300"
                    required
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium">
                    Section Name
                </label>

                <input
                    type="text"
                    name="section_name"
                    value={form.section_name}
                    onChange={handleChange}
                    className="w-full rounded-lg border-slate-300"
                    required
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium">
                    Description
                </label>

                <textarea
                    rows="3"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full rounded-lg border-slate-300"
                />
            </div>

            <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                />
                Active Section
            </label>

            <button
                type="submit"
                className="w-full rounded-lg bg-indigo-600 py-2 text-white"
            >
                Save Section
            </button>
        </form>
    );
}
