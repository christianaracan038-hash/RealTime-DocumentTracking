/*
 * Date entry as Month / Day / Year, with the result written out in full.
 *
 * The browser's own date input looks different on every phone and
 * desktop, and on some of them the format is ambiguous. Three dropdowns
 * look and behave the same everywhere, need no typing, and match how
 * dates are written on the forms this office already uses. The value
 * handed back is always YYYY-MM-DD.
 */

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const SELECT =
    "min-h-12 w-full rounded-xl border border-line bg-white px-3 py-3 text-base text-navy-900 focus:border-brand-600";

const pad = (n) => String(n).padStart(2, "0");

export function today() {
    const d = new Date();

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysIn(year, month) {
    if (!year || !month) return 31;

    return new Date(year, month, 0).getDate();
}

export default function DateField({ value = "", onChange, id = "date" }) {
    const [y, m, d] = value ? value.split("-").map(Number) : ["", "", ""];

    const thisYear = new Date().getFullYear();
    const years = Array.from({ length: 7 }, (_, i) => thisYear - 5 + i);

    const set = (part, next) => {
        let year = y || "";
        let month = m || "";
        let day = d || "";

        if (part === "year") year = next;
        if (part === "month") month = next;
        if (part === "day") day = next;

        // A day past the end of the new month falls back to its last day.
        const max = daysIn(year, month);
        if (day && day > max) day = max;

        onChange(
            year && month && day ? `${year}-${pad(month)}-${pad(day)}` : "",
        );
    };

    const written =
        y && m && d
            ? new Date(y, m - 1, d).toLocaleDateString("en-PH", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
              })
            : null;

    return (
        <div>
            <div className="grid grid-cols-[1.6fr_1fr_1.2fr] gap-2">
                <select
                    id={id}
                    aria-label="Month"
                    value={m || ""}
                    onChange={(e) => set("month", Number(e.target.value))}
                    className={SELECT}
                >
                    <option value="">Month</option>
                    {MONTHS.map((name, i) => (
                        <option key={name} value={i + 1}>
                            {name}
                        </option>
                    ))}
                </select>

                <select
                    aria-label="Day"
                    value={d || ""}
                    onChange={(e) => set("day", Number(e.target.value))}
                    className={SELECT}
                >
                    <option value="">Day</option>
                    {Array.from({ length: daysIn(y, m) }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {i + 1}
                        </option>
                    ))}
                </select>

                <select
                    aria-label="Year"
                    value={y || ""}
                    onChange={(e) => set("year", Number(e.target.value))}
                    className={SELECT}
                >
                    <option value="">Year</option>
                    {years.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>

            {written && (
                <p className="mt-2 text-base font-semibold text-navy-800">
                    {written}
                </p>
            )}
        </div>
    );
}
