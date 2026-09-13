import { usePage } from "@inertiajs/react";

export default function Header({ title, onOpenMenu = () => {} }) {
    const { auth } = usePage().props;

    return (
        <header className="sticky top-0 z-30 border-b border-line bg-white px-4 py-3 sm:px-6 lg:px-8 lg:py-5">
            <div className="flex items-center gap-3">
                {/* Menu - phones and tablets only */}
                <button
                    type="button"
                    onClick={onOpenMenu}
                    aria-label="Open menu"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-navy-900 transition hover:bg-paper lg:hidden"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        aria-hidden="true"
                    >
                        <path d="M4 7h16M4 12h16M4 17h16" />
                    </svg>
                </button>

                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <h1 className="truncate text-lg font-bold text-navy-900 sm:text-xl lg:text-2xl">
                        {title ?? "Employee Portal"}
                    </h1>

                    {/*
                     * Repeating the section here means someone who walks up
                     * to a shared machine can tell whose account is open
                     * without opening a menu. Hidden on phones, where the
                     * drawer already shows it and the width is needed.
                     */}
                    {auth?.employee?.section_name && (
                        <p className="hidden text-sm text-muted sm:block">
                            Signed in as{" "}
                            <span className="font-semibold text-navy-800">
                                {auth.employee.username}
                            </span>{" "}
                            &middot; {auth.employee.section_name}
                        </p>
                    )}
                </div>
            </div>
        </header>
    );
}
