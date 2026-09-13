import { usePage } from "@inertiajs/react";

export default function Header({ title }) {
    const { auth } = usePage().props;

    return (
        <header className="border-b border-line bg-white px-8 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-bold text-navy-900 sm:text-2xl">
                    {title ?? "Employee Portal"}
                </h1>

                {/*
                 * Repeating the section here means someone who walks up
                 * to a shared machine can tell whose account is open
                 * without opening a menu.
                 */}
                {auth?.employee?.section_name && (
                    <p className="text-sm text-muted">
                        Signed in as{" "}
                        <span className="font-semibold text-navy-800">
                            {auth.employee.username}
                        </span>{" "}
                        &middot; {auth.employee.section_name}
                    </p>
                )}
            </div>
        </header>
    );
}
