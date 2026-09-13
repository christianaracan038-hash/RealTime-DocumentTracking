import InputError from "@/Components/InputError";
import EmployeeButton from "@/Components/Employee/EmployeeButton";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, useForm } from "@inertiajs/react";

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        login: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    const field =
        "min-h-12 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-navy-900 placeholder:text-muted focus:border-brand-600";

    return (
        <GuestLayout>
            <Head title="Log in" />

            <h2 className="text-2xl font-bold text-navy-900">Sign in</h2>

            <p className="mt-1 text-base text-muted">
                Use the username and password given to you by your
                administrator.
            </p>

            {status && (
                <p className="mt-6 rounded-xl bg-ok-100 px-4 py-3 text-base font-medium text-ok-600">
                    {status}
                </p>
            )}

            <form onSubmit={submit} className="mt-8 space-y-5">
                <div>
                    <label
                        htmlFor="login"
                        className="mb-1.5 block text-base font-semibold text-navy-800"
                    >
                        Username
                    </label>

                    <input
                        id="login"
                        type="text"
                        name="login"
                        value={data.login}
                        autoComplete="username"
                        autoFocus
                        placeholder="e.g. rdo.staff"
                        onChange={(e) => setData("login", e.target.value)}
                        className={field}
                    />

                    <InputError message={errors.login} className="mt-2" />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="mb-1.5 block text-base font-semibold text-navy-800"
                    >
                        Password
                    </label>

                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoComplete="current-password"
                        onChange={(e) => setData("password", e.target.value)}
                        className={field}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <label className="flex items-center gap-3 py-1">
                    <input
                        type="checkbox"
                        name="remember"
                        checked={data.remember}
                        onChange={(e) => setData("remember", e.target.checked)}
                        className="h-5 w-5 rounded border-line text-brand-600"
                    />

                    <span className="text-base text-navy-800">
                        Keep me signed in on this computer
                    </span>
                </label>

                <EmployeeButton
                    type="submit"
                    size="lg"
                    disabled={processing}
                    className="w-full"
                >
                    {processing ? "Signing in..." : "Sign in"}
                </EmployeeButton>
            </form>
        </GuestLayout>
    );
}
