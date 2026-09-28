import GreetingClock from "./GreetingClock";
import Icon from "./Icon";

export default function Header({ title, onOpenMenu = () => {} }) {
    return (
        <header className="sticky top-0 z-30 border-b border-line bg-surface px-4 py-3 sm:px-6 lg:px-8 lg:py-5">
            <div className="flex items-center gap-3">
                {/* Menu - phones and tablets only */}
                <button
                    type="button"
                    onClick={onOpenMenu}
                    aria-label="Open menu"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-navy-900 transition hover:bg-sunken lg:hidden"
                >
                    <Icon name="menu" className="text-xl" />
                </button>

                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <h1 className="truncate text-lg font-bold text-navy-900 sm:text-xl lg:text-2xl">
                        {title ?? "Employee Portal"}
                    </h1>

                    {/*
                     * Who is at this machine and what the time is. On a
                     * shared desk that is the first thing anybody needs,
                     * and it used to be answered with a username.
                     *
                     * Hidden on phones, where the drawer already names
                     * the account and the width is needed for the title.
                     */}
                    <GreetingClock className="hidden sm:block" />
                </div>
            </div>
        </header>
    );
}
