import { Head, Link, usePage } from "@inertiajs/react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

/*
 * Where a super administrator lands.
 *
 * The question this page answers is "who can get into the system, and is
 * anybody missing?" - broken down by section, because that is how the
 * office thinks about its own staff and because a section whose people
 * cannot sign in is a section whose documents stop moving.
 *
 * It is not called "Admin" anywhere visible: the office has an Admin
 * Section that handles referrals like Compliance or CSS, and conflating
 * the two is what made the old landing page confusing.
 */

function Stat({ label, value, sub, tone = "slate" }) {
    const tones = {
        slate: "text-slate-900",
        emerald: "text-emerald-700",
        amber: "text-amber-700",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>

            <p className={`mt-1 text-3xl font-bold ${tones[tone]}`}>{value}</p>

            {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
        </div>
    );
}

export default function Dashboard() {
    const { sections, totals, needsNaming, rolesInUse, auth } = usePage().props;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-slate-900">
                            Overview
                        </h2>

                        <p className="text-sm text-slate-500">
                            Who can sign in to the system, and which sections
                            they belong to.
                        </p>
                    </div>

                    <p className="text-sm text-slate-500">
                        Signed in as{" "}
                        <span className="font-semibold text-slate-800">
                            {auth.user.name}
                        </span>
                    </p>
                </div>
            }
        >
            <Head title="Super Admin" />

            <div className="bg-slate-50 py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Stat
                            label="Employee accounts"
                            value={totals.employees}
                            sub={`${totals.employees_active} can sign in`}
                        />

                        <Stat
                            label="Super admins"
                            value={totals.administrators_active}
                            tone={
                                totals.administrators_active === 1
                                    ? "amber"
                                    : "emerald"
                            }
                            sub={
                                totals.administrators_active === 1
                                    ? "Only one - add a second"
                                    : `${totals.administrators} in total`
                            }
                        />

                        <Stat
                            label="Sections"
                            value={totals.sections}
                            sub={`${totals.roles} roles`}
                        />

                        <Stat
                            label="Without a name"
                            value={totals.employees_unnamed}
                            tone={
                                totals.employees_unnamed > 0
                                    ? "amber"
                                    : "emerald"
                            }
                            sub={
                                totals.employees_unnamed > 0
                                    ? "Showing usernames instead of people"
                                    : "Every account is named"
                            }
                        />
                    </div>

                    {/*
                     * Accounts with nobody's name against them. Listed
                     * rather than counted, because each one needs opening
                     * and naming before the trail reads properly.
                     */}
                    {needsNaming.length > 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                            <h3 className="font-semibold text-amber-900">
                                These accounts have no name on file
                            </h3>

                            <p className="mt-1 text-sm text-amber-800">
                                Until they do, every screen that should say who
                                handled a document shows a username instead.
                            </p>

                            <ul className="mt-3 flex flex-wrap gap-2">
                                {needsNaming.map((account) => (
                                    <li
                                        key={account.employee_id}
                                        className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-amber-200"
                                    >
                                        <span className="font-medium text-slate-800">
                                            {account.username}
                                        </span>

                                        <span className="ml-2 text-slate-500">
                                            {account.section ?? "no section"}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={route("super.employees.index")}
                                className="mt-4 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                            >
                                Name them
                            </Link>
                        </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                        {/* Accounts per section */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        Sections
                                    </h3>

                                    <p className="text-sm text-slate-500">
                                        A section with nobody able to sign in is
                                        a section whose documents stop moving.
                                    </p>
                                </div>

                                <Link
                                    href={route("super.employees.index")}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                >
                                    Authorise someone
                                </Link>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                                Section
                                            </th>

                                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                                Accounts
                                            </th>

                                            <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                                Can sign in
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {sections.map((section) => (
                                            <tr key={section.section_id}>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-slate-800">
                                                        {section.description ||
                                                            section.section_name}
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        {section.section_name} ·{" "}
                                                        {section.section_code}
                                                        {section.is_active
                                                            ? ""
                                                            : " · inactive"}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3 text-slate-600">
                                                    {section.accounts}

                                                    {section.unnamed > 0 && (
                                                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                                            {section.unnamed}{" "}
                                                            unnamed
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {section.active > 0 ? (
                                                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                            {section.active}
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                                                            Nobody
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Roles, and whether anybody holds them */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Roles
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    A role named in{" "}
                                    <code className="rounded bg-slate-100 px-1">
                                        registration_roles
                                    </code>{" "}
                                    limits an account to the registration desk.
                                </p>

                                <ul className="mt-4 space-y-2">
                                    {rolesInUse.map((role) => (
                                        <li
                                            key={role.role_id}
                                            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                                        >
                                            <span className="font-medium text-slate-800">
                                                {role.role_name}
                                            </span>

                                            <span className="text-sm text-slate-500">
                                                {role.accounts}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={route("super.roles.index")}
                                    className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                >
                                    Manage roles →
                                </Link>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Super admins
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Switching one off is how a developer&apos;s
                                    access ends when the office takes the system
                                    over.
                                </p>

                                <Link
                                    href={route("super.administrators.index")}
                                    className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                >
                                    Manage super admins →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
