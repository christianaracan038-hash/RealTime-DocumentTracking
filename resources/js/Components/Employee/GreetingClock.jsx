import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";

/*
 * Who is signed in, and what the time is.
 *
 * The header already tried to answer the first question and answered it
 * with a username, which is no use to anybody walking up to a shared
 * machine. It says the person now.
 *
 * The clock ticks. These screens are left open all morning, and a time
 * printed once at page load would quietly be hours wrong by the time
 * anybody read it - on a system whose whole subject is how long a
 * document has been waiting, that is worse than showing nothing.
 *
 * Manila time regardless of what the machine is set to, the same as
 * every other time in the app.
 */

const MANILA = "Asia/Manila";

const DATE = new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
});

const TIME = new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
});

/*
 * h23 rather than hour12:false, which returns 24 at midnight on some
 * browsers and would greet the night shift with "Good evening" an hour
 * into the next day.
 */
const HOUR = new Intl.DateTimeFormat("en-GB", {
    timeZone: MANILA,
    hour: "2-digit",
    hourCycle: "h23",
});

function greetingFor(now) {
    const hour = Number(HOUR.format(now));

    if (hour < 12) return "Good Morning";

    if (hour < 18) return "Good Afternoon";

    return "Good Evening";
}

/** "9:14AM", the office's own format - no space before the meridiem. */
function clockTime(now) {
    return TIME.format(now).replace(/\s?(AM|PM)$/i, (m, p) => p.toUpperCase());
}

export default function GreetingClock({ className = "" }) {
    const { auth } = usePage().props;

    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        /*
         * Every thirty seconds, so the minute is never more than half a
         * minute stale. Cheap: this redraws two lines of text.
         */
        const tick = setInterval(() => setNow(new Date()), 30000);

        return () => clearInterval(tick);
    }, []);

    const employee = auth?.employee;

    if (!employee) return null;

    const name = employee.short_name;

    return (
        <div className={`text-right ${className}`}>
            <p className="text-base font-semibold text-white">
                {greetingFor(now)}
                {name ? `, ${name}` : ""}
            </p>

            <p className="mt-0.5 text-sm text-navy-200">
                {DATE.format(now)} &middot; {clockTime(now)}
                {!name && employee.username ? (
                    <> &middot; {employee.username}</>
                ) : null}
                {employee.section_name ? (
                    <> &middot; {employee.section_name}</>
                ) : null}
            </p>
        </div>
    );
}
