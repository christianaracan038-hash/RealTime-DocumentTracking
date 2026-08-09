import { Link } from "@inertiajs/react";
import UserInfo from "./UserInfo";

export default function Sidebar() {
    return (
        <aside className="w-72 bg-white border-r border-slate-200">
            <div className="border-b border-slate-200 p-6">
                <h2 className="text-xl font-bold text-indigo-600">
                    Real-Time Document Tracking
                </h2>

                <p className="text-sm text-slate-500">Employee Portal</p>
            </div>

            <nav className="flex-1 space-y-2 p-4">
                <Link
                    href={route("rdo.dashboard")}
                    className="block rounded-lg px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                >
                    Dashboard
                </Link>

                <Link
                    href={route("documents.index")}
                    className="block rounded-lg px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                >
                    Documents
                </Link>

                <Link
                    href={route("documents.create")}
                    className="block rounded-lg px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                >
                    Register Document
                </Link>

                {/* <Link
                    href={route("tracking.index")}
                    className="block rounded-lg px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                >
                    Tracking
                </Link> */}
            </nav>

            <UserInfo />
        </aside>
    );
}
