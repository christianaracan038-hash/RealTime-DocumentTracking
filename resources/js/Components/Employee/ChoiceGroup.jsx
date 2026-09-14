/*
 * A list of options shown as tick boxes, like the boxes on the paper
 * form this replaces.
 *
 * Each option is one large tile - the whole tile is the tap target, so
 * it works with a thumb on a phone. Tiles stack in one column on phones
 * and two from sm up.
 *
 * `multiple` allows several ticks (Concerns, For). Without it the group
 * behaves like radio buttons (Remarks).
 *
 * Ticking "Other" reveals a text box beneath the list. Its value is
 * passed back separately through `onOtherChange`.
 */

const FIELD =
    "min-h-12 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-navy-900 placeholder:text-muted focus:border-brand-600";

export default function ChoiceGroup({
    name,
    options = [],
    value,
    onChange,
    multiple = false,
    otherValue = "",
    onOtherChange = () => {},
    otherPlaceholder = "Please specify",
    otherError = null,
}) {
    const selected = multiple ? (value ?? []) : value ? [value] : [];

    const isTicked = (option) => selected.includes(option);

    const toggle = (option) => {
        if (multiple) {
            onChange(
                isTicked(option)
                    ? selected.filter((o) => o !== option)
                    : [...selected, option],
            );
        } else {
            onChange(option);
        }
    };

    const otherTicked = isTicked("Other");

    return (
        <div>
            <div className="grid gap-2 sm:grid-cols-2">
                {options.map((option) => {
                    const ticked = isTicked(option);

                    return (
                        <label
                            key={option}
                            className={`flex min-h-13 cursor-pointer items-center gap-3 rounded-xl border-2 bg-white px-4 py-3 transition select-none ${
                                ticked
                                    ? "border-brand-600 bg-brand-50"
                                    : "border-line hover:border-brand-200"
                            }`}
                        >
                            <input
                                type={multiple ? "checkbox" : "radio"}
                                name={name}
                                value={option}
                                checked={ticked}
                                onChange={() => toggle(option)}
                                className="sr-only"
                            />

                            {/* The visible tick box */}
                            <span
                                aria-hidden="true"
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                                    ticked
                                        ? "border-brand-600 bg-brand-600 text-white"
                                        : "border-navy-200 bg-white"
                                }`}
                            >
                                {ticked && (
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 14 14"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M2.5 7.5l3 3 6-7" />
                                    </svg>
                                )}
                            </span>

                            <span
                                className={`text-base ${
                                    ticked
                                        ? "font-semibold text-navy-900"
                                        : "font-medium text-navy-800"
                                }`}
                            >
                                {option}
                            </span>
                        </label>
                    );
                })}
            </div>

            {otherTicked && (
                <div className="mt-3">
                    <input
                        type="text"
                        value={otherValue}
                        onChange={(e) => onOtherChange(e.target.value)}
                        placeholder={otherPlaceholder}
                        aria-label={`${name} - other`}
                        autoFocus
                        className={FIELD}
                    />

                    {otherError && (
                        <p className="mt-2 text-sm font-medium text-stop-600">
                            {otherError}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
