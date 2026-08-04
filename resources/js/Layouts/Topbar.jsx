import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import NavLink from "@/Components/NavLink";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function Topbar() {
    const user = usePage().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <nav className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex">
                        <div className="flex shrink-0 items-center">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="rounded-xl bg-indigo-600 p-2 text-white shadow-sm">
                                    <ApplicationLogo className="block h-6 w-6 fill-current" />
                                </div>
                                <div className="leading-tight">
                                    <p className="text-sm font-semibold text-slate-900">
                                        Realtime Docs
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Admin Control
                                    </p>
                                </div>
                            </Link>
                        </div>

                        <div className="hidden space-x-6 sm:-my-px sm:ms-8 sm:flex">
                            <NavLink
                                href={route("dashboard")}
                                active={route().current("dashboard")}
                            >
                                Dashboard
                            </NavLink>
                            <NavLink
                                href={route("admin.dashboard")}
                                active={route().current("admin.dashboard")}
                            >
                                Employees
                            </NavLink>
                            <NavLink
                                href={route("sections.index")}
                                active={route().current("sections.*")}
                            >
                                Sections
                            </NavLink>
                            <NavLink
                                href={route("roles.index")}
                                active={route().current("roles.*")}
                            >
                                Roles
                            </NavLink>
                        </div>
                    </div>

                    <div className="hidden sm:ms-6 sm:flex sm:items-center">
                        <div className="relative ms-3">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <span className="inline-flex rounded-md">
                                        <button
                                            type="button"
                                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                        >
                                            {user.name}
                                            <svg
                                                className="-me-0.5 ms-2 h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </span>
                                </Dropdown.Trigger>

                                <Dropdown.Content>
                                    <Dropdown.Link href={route("profile.edit")}>
                                        Profile
                                    </Dropdown.Link>
                                    <Dropdown.Link
                                        href={route("logout")}
                                        method="post"
                                        as="button"
                                    >
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>

                    <div className="-me-2 flex items-center sm:hidden">
                        <button
                            onClick={() =>
                                setShowingNavigationDropdown(
                                    (previousState) => !previousState,
                                )
                            }
                            className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                            <svg
                                className="h-6 w-6"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    className={
                                        !showingNavigationDropdown
                                            ? "inline-flex"
                                            : "hidden"
                                    }
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                                <path
                                    className={
                                        showingNavigationDropdown
                                            ? "inline-flex"
                                            : "hidden"
                                    }
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div
                className={
                    (showingNavigationDropdown ? "block" : "hidden") +
                    " sm:hidden"
                }
            >
                <div className="space-y-1 border-t border-slate-200 px-4 pb-3 pt-2">
                    <ResponsiveNavLink
                        href={route("dashboard")}
                        active={route().current("dashboard")}
                    >
                        Dashboard
                    </ResponsiveNavLink>
                    <ResponsiveNavLink
                        href={route("admin.dashboard")}
                        active={route().current("admin.dashboard")}
                    >
                        Employees
                    </ResponsiveNavLink>
                    <ResponsiveNavLink
                        href={route("sections.index")}
                        active={route().current("sections.*")}
                    >
                        Sections
                    </ResponsiveNavLink>
                    <ResponsiveNavLink
                        href={route("roles.index")}
                        active={route().current("roles.*")}
                    >
                        Roles
                    </ResponsiveNavLink>
                </div>

                <div className="border-t border-slate-200 px-4 pb-4 pt-3">
                    <div className="text-sm font-semibold text-slate-900">
                        {user.name}
                    </div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                    <div className="mt-3 space-y-1">
                        <ResponsiveNavLink href={route("profile.edit")}>
                            Profile
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            method="post"
                            href={route("logout")}
                            as="button"
                        >
                            Log Out
                        </ResponsiveNavLink>
                    </div>
                </div>
            </div>
        </nav>
    );
}
