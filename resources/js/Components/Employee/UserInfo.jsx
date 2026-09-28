import { usePage, router } from "@inertiajs/react";

import Avatar from "./Avatar";
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
                 * Their photograph, falling back to initials - which is
                 * what happens when it was uploaded on another machine and
                 * the avatar disk is still a local folder.
                 */}
                <Avatar url={employee?.avatar_url} name={name} />

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
