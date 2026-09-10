import { usePage, router } from "@inertiajs/react";

export default function UserInfo() {
    const { auth } = usePage().props;

    const logout = () => {
        router.post(route("logout"));
    };

    return (
        <div className="border-t border-slate-700 p-4">
            <div className="mb-3">
                <h3 className="font-semibold text-slate-900">
                    {auth?.employee?.username}
                </h3>

                <p className="text-sm text-slate-500">
                    {auth?.employee?.section_name}
                </p>
            </div>

            <button
                onClick={logout}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
                Logout
            </button>
        </div>
    );
}
