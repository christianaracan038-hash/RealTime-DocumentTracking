export default function Header() {
    return (
        <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-[#003B71]">
                        Bureau of Internal Revenue
                    </h1>

                    <p className="text-xs text-slate-500">
                        Track your documents in real-time with our efficient
                        document tracking system.
                    </p>
                </div>

                <div className="h-8 w-1 rounded-full bg-[#A6192E]" />
            </div>

            <div className="mt-3 h-0.5 w-full bg-[#F6C344]" />
        </header>
    );
}
