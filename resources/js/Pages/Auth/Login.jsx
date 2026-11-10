import EmployeeButton from "@/Components/Employee/EmployeeButton";
import Icon from "@/Components/Employee/Icon";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";

/*
 * Sign-in form. It sits on the navy card in GuestLayout, so everything
 * here is styled for a dark ground: white text, white fields, and the
 * attention yellow on the one button - the thing to press.
 */

function EyeIcon({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function EyeOffIcon({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.17 4.19" />
            <path d="M6.61 6.61A17.5 17.5 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
    );
}

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

    const [showPassword, setShowPassword] = useState(false);

    const field =
        "min-h-12 w-full rounded-xl border-2 border-transparent bg-white px-4 py-3 text-base text-navy-900 placeholder:text-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40";

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

                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={data.password}
                            autoComplete="current-password"
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            className={`${field} pr-14`}
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            aria-label={
                                showPassword ? "Hide password" : "Show password"
                            }
                            aria-pressed={showPassword}
                            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-muted hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>

                    <FieldError message={errors.password} />
                </div>

                <label className="flex items-center gap-3 py-1">
                    <input
                        type="checkbox"
                        name="remember"
                        checked={data.remember}
                        onChange={(e) => setData("remember", e.target.checked)}
                        className="h-5 w-5 rounded border-navy-400 bg-navy-800 text-brand-500 focus:ring-brand-500"
                    />

                    <span className="text-base text-white">
                        Keep me signed-in on this computer
                    </span>
                </label>

                <EmployeeButton
                    type="submit"
                    variant="quiet"
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
