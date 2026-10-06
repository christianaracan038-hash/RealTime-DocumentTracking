import GreetingClock from "./GreetingClock";
import Icon from "./Icon";

export default function Header({ title, onOpenMenu = () => {} }) {
    return (
        <header className="sticky top-0 z-30 border-b border-navy-800 bg-navy-900 px-4 py-3 sm:px-6 lg:px-8 lg:py-5">
            <div className="flex items-center gap-3">
                {/* Menu - phones and tablets only */}
                <button
                    type="button"
                    onClick={onOpenMenu}
                    aria-label="Open menu"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-navy-200 transition hover:bg-navy-800 hover:text-white lg:hidden"
                >
                    <Icon name="menu" className="text-xl" />
                </button>

                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <h1 className="truncate text-lg font-bold text-white sm:text-xl lg:text-2xl">
                        {title ?? "Employee Portal"}
                    </h1>

                    <GreetingClock className="hidden sm:block text-white" />
                </div>
            </div>
        </header>
    );
}
