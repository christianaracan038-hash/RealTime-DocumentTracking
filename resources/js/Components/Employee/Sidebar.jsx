import { Link, usePage } from "@inertiajs/react";
import UserInfo from "./UserInfo";
import navigation from "@/config/navigation";

export default function Sidebar() {
    const { auth } = usePage().props;
    const sectionName = auth?.employee?.section_name?.toUpperCase();
    const menuItems = navigation[sectionName] ?? [];

    return (
        <aside className="fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-[#003B71] text-white shadow-xl">
            <div className="shrink-0 border-b border-white/10 bg-[#003B71] px-5 py-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-[#003B71] shadow-md">
                        BIR
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-sm font-bold leading-tight">
                            Real-Time Document
                            <br />
                            Tracking
                        </h1>

                        <p className="mt-1 text-xs text-white/60">
                            Employee Portal
                        </p>
                    </div>
                </div>

                <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                        Current Section
                    </p>

                    <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                        <span className="h-2 w-2 rounded-full bg-[#F6C344]" />

                        <span className="truncate text-xs font-semibold text-white">
                            {sectionName ?? "Employee"}
                        </span>
                    </div>
                </div>
            </div>

            <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
                {menuItems.map((item) => (
                    <Link
                        key={item.route}
                        href={route(item.route)}
                        className="group flex items-center rounded-lg px-3 py-3 text-sm font-medium text-white/75 transition-all duration-200 hover:bg-white/10 hover:text-white"
                    >
                        <span className="mr-3 h-1.5 w-1.5 rounded-full bg-transparent transition-all group-hover:bg-[#F6C344]" />

                        <span className="truncate">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="shrink-0 border-t border-white/10 bg-[#002F5C]">
                <UserInfo />
            </div>

            <div className="h-1 shrink-0 bg-[#A6192E]" />
        </aside>
    );
}
