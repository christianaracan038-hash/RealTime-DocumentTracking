import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function AdminLayout({ title, children }) {
    const { auth } = usePage().props;
    const user = auth.user;

    const [sidebarOpen, setSidebarOpen] = useState(true);

    const menus = [
        {
            name: "Dashboard",
            route: "dashboard",
        },
        {
            name: "Employee Accounts",
            route: "admin.employees.index",
        },
        {
            name: "Sections",
            route: "admin.sections.index",
        },
        {
            name: "Roles",
            route: "admin.roles.index",
        },
        {
            name: "Documents",
            route: "admin.documents.index",
        },
        {
            name: "Tracking",
            route: "admin.tracking.index",
        },
        {
            name: "Audit Trail",
            route: "admin.audit.index",
        },
    ];

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}

            <aside
                className={`${
                    sidebarOpen ? "w-64" : "w-20"
                } bg-slate-900 text-white transition-all duration-300`}
            >
                <div className="flex items-center justify-between border-b border-slate-700 p-5">
                    <h1 className="text-lg font-bold">BIR DTS</h1>

                    <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                        ☰
                    </button>
                </div>

                <nav className="mt-5">
                    {menus.map((menu) => (
                        <Link
                            key={menu.name}
                            href={route(menu.route)}
                            className={`block px-5 py-3 hover:bg-slate-700 ${
                                route().current(menu.route)
                                    ? "bg-slate-800"
                                    : ""
                            }`}
                        >
                            {menu.name}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main */}

            <div className="flex flex-1 flex-col">
                {/* Topbar */}

                <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
                    <h2 className="text-xl font-semibold">{title}</h2>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="font-semibold">{user.name}</p>

                            <p className="text-sm text-gray-500">
                                Administrator
                            </p>
                        </div>

                        <Link
                            href={route("logout")}
                            method="post"
                            as="button"
                            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                        >
                            Logout
                        </Link>
                    </div>
                </header>

                {/* Content */}

                <main className="flex-1 p-6">
                    <div className="rounded-lg bg-white p-6 shadow">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
