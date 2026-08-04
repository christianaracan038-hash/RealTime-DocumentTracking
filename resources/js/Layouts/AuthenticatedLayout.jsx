import Topbar from "@/Layouts/Topbar";

export default function AuthenticatedLayout({ header, children }) {
    return (
        <div className="min-h-screen bg-slate-50">
            <Topbar />

            {header && (
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}
