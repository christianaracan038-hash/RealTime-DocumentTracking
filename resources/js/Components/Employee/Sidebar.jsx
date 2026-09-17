import { Link, usePage } from "@inertiajs/react";

import UserInfo from "./UserInfo";
import Logos from "./Logos";
import Icon from "./Icon";
import navigation from "@/config/navigation";

export default function Sidebar({ open = false, onClose = () => {} }) {
    const { auth } = usePage().props;

    const sectionName = auth?.employee?.section_name?.toUpperCase();

    /*
     * Some sections in navigation.js point at dashboards that have not
     * been built yet. Ziggy's route() throws on an unregistered name, so
     * those entries are dropped rather than crashing the whole sidebar.
     */
    const menuItems = (navigation[sectionName] ?? []).filter((item) =>
        route().has(item.route),
    );

    return (
        <>
            {/* Backdrop - phones and tablets only, while the drawer is open */}
            <div
                onClick={onClose}
                aria-hidden="true"
                className={`fixed inset-0 z-40 bg-navy-950/60 transition-opacity lg:hidden ${
                    open ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
            />

            <aside
                aria-label="Main menu"
                className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[85vw] flex-col bg-navy-900 transition-transform duration-200 lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Identity */}
                <div className="shrink-0 px-6 py-6 lg:py-7">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <Logos size="sm" className="mb-4" />

                            <p className="text-sm font-semibold tracking-wide text-accent-400 uppercase">
                                Document Tracking
                            </p>

                            <p className="mt-1 text-sm text-navy-200">
                                Employee Portal
                            </p>
                        </div>

                        {/* Close - drawer only */}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close menu"
                            className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl leading-none text-navy-200 transition hover:bg-navy-800 hover:text-white lg:hidden"
                        >
                            <Icon name="close" />
                        </button>
                    </div>

                    {/* Which section you are working as */}
                    <div className="mt-5 rounded-xl bg-navy-800 px-4 py-3">
                        <p className="text-xs tracking-wide text-navy-400 uppercase">
                            Your section
                        </p>

                        <p className="mt-0.5 text-lg font-bold text-white">
                            {sectionName ?? "Employee"}
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-4">
                    {menuItems.map((item) => {
                        const isCurrent = route().current(item.route);

                        return (
                            <Link
                                key={item.route}
                                href={route(item.route)}
                                aria-current={isCurrent ? "page" : undefined}
                                className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition ${
                                    isCurrent
                                        ? "bg-navy-800 text-white"
                                        : "text-navy-200 hover:bg-navy-800 hover:text-white"
                                }`}
                            >
                                {/*
                                 * The yellow bar is the only thing on screen
                                 * that says "you are here".
                                 */}
                                <span
                                    aria-hidden="true"
                                    className={`h-6 w-1 rounded-full transition ${
                                        isCurrent
                                            ? "bg-accent-400"
                                            : "bg-transparent"
                                    }`}
                                />

                                <Icon
                                    name={item.icon}
                                    className={`w-5 text-center ${
                                        isCurrent
                                            ? "text-accent-400"
                                            : "text-navy-400"
                                    }`}
                                />

                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User / Logout */}
                <div className="shrink-0">
                    <UserInfo />
                </div>
            </aside>
        </>
    );
}
