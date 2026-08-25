import { Link, usePage } from "@inertiajs/react";

import UserInfo from "./UserInfo";
import navigation from "@/config/navigation";

export default function Sidebar() {
    const { auth } = usePage().props;

    const sectionName = auth?.employee?.section_name?.toUpperCase();

    const menuItems = navigation[sectionName] ?? [];

    return (
        <aside className="fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
            {/* Header */}
            <div className="shrink-0 border-b p-6">
                <h1 className="text-lg font-bold text-slate-800">
                    Real-Time Document Tracking
                </h1>

                <p className="text-sm text-slate-500">Employee Portal</p>

                {/* Current Section */}
                <div className="mt-4">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {sectionName ?? "Employee"}
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                {menuItems.map((item) => (
                    <Link
                        key={item.route}
                        href={route(item.route)}
                        className="block rounded-lg px-4 py-3 text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* User / Logout */}
            <div className="shrink-0 border-t border-slate-200">
                <UserInfo />
            </div>
        </aside>
    );
}
