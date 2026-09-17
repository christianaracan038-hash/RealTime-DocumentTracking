import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, useForm } from "@inertiajs/react";

/*
 * Sign-in form. It sits on the navy card in GuestLayout, so everything
 * here is styled for a dark ground: white text, white fields, and the
 * attention yellow on the one button - the thing to press.
 */

function FieldError({ message }) {
    if (!message) return null;

    return (
        <p className="mt-2 flex items-start gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white">
            <Icon name="warning" className="mt-0.5 shrink-0 text-accent-400" />
            {message}
        </p>
    );
}

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
        "min-h-12 w-full rounded-xl border-2 border-transparent bg-white px-4 py-3 text-base text-navy-900 placeholder:text-muted focus:border-accent-400";

    return (
        <GuestLayout>
            <Head title="Log in" />

            <h2 className="text-2xl font-bold text-white">Sign in</h2>

            <p className="mt-1 text-base text-navy-200">
                Use the username and password given to you by your
                administrator.
            </p>

            {status && (
                <p className="mt-6 rounded-xl bg-white px-4 py-3 text-base font-medium text-ok-600">
                    {status}
                </p>
            )}

            <form onSubmit={submit} className="mt-8 space-y-5">
                <div>
                    <label
                        htmlFor="login"
                        className="mb-1.5 block text-base font-semibold text-white"
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

                    <FieldError message={errors.login} />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="mb-1.5 block text-base font-semibold text-white"
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

                    <FieldError message={errors.password} />
                </div>

                <label className="flex items-center gap-3 py-1">
                    <input
                        type="checkbox"
                        name="remember"
                        checked={data.remember}
                        onChange={(e) => setData("remember", e.target.checked)}
                        className="h-5 w-5 rounded border-navy-400 bg-navy-800 text-accent-400 focus:ring-accent-400"
                    />

                    <span className="text-base text-white">
                        Keep me signed in on this computer
                    </span>
                </label>

                <EmployeeButton
                    type="submit"
                    variant="accent"
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
