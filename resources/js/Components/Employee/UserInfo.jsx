import { usePage, router } from "@inertiajs/react";

import Icon from "./Icon";

export default function UserInfo() {
    const { auth } = usePage().props;

    const logout = () => {
        router.post(route("logout"));
    };

    const employee = auth?.employee;

    /*
     * The person, not the account. display_name falls back to the
     * username for the accounts that predate the name columns, so this
     * is never blank.
     */
    const name = employee?.display_name ?? employee?.username;

    return (
        <div className="border-t border-navy-800 px-4 py-5">
            <div className="mb-4 flex items-center gap-3 px-2">
                {/*
                 * Their initial. Profile photos are not stored yet; a
                 * letter reads better than a generic silhouette.
                 */}
                <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-400 text-lg font-bold text-navy-900"
                >
                    {name?.charAt(0)?.toUpperCase() ?? "?"}
                </span>

                <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                        {name ?? "Signed in"}
                    </p>

                    <p className="truncate text-sm text-navy-400">
                        {employee?.section_name}
                    </p>
                </div>
            </div>

            <button
                onClick={logout}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-navy-600 px-4 py-2.5 text-base font-semibold text-navy-200 transition hover:bg-navy-800 hover:text-white"
            >
                <Icon name="logout" />
                Log out
            </button>
        </div>
    );
}
