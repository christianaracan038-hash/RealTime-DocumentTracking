import { usePage, router } from "@inertiajs/react";

export default function UserInfo() {
    const { auth } = usePage().props;

    const logout = () => {
        router.post(route("logout"));
    };

    const username = auth?.employee?.username;

    return (
        <div className="border-t border-navy-800 px-4 py-5">
            <div className="mb-4 flex items-center gap-3 px-2">
                {/*
                 * Initial instead of an avatar image - there are no
                 * profile photos, and a letter is clearer than a
                 * generic silhouette.
                 */}
                <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-400 text-lg font-bold text-navy-900"
                >
                    {username?.charAt(0)?.toUpperCase() ?? "?"}
                </span>

                <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                        {username ?? "Signed in"}
                    </p>

                    <p className="text-sm text-navy-400">
                        {auth?.employee?.section_name}
                    </p>
                </div>
            </div>

            <button
                onClick={logout}
                className="min-h-11 w-full rounded-xl border border-navy-600 px-4 py-2.5 text-base font-semibold text-navy-200 transition hover:bg-navy-800 hover:text-white"
            >
                Log out
            </button>
        </div>
    );
}
