/*
 * Small helpers shared by the referral form, the table and the printed
 * slip, so all three describe a referral the same way.
 */

/**
 * "Compliance Section", "Revenue District Office" - the section's
 * description when the admin has written one, otherwise a readable
 * version of its code name.
 */
export function sectionLabel(section) {
    if (!section) return "";

    if (section.description) return section.description;

    const name = section.section_name ?? "";

    // RDO stays RDO; ASSESSMENT becomes Assessment Section.
    if (name.length <= 3) return `${name} Section`;

    return (
        name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() + " Section"
    );
}

/**
 * The "TO" line on the slip: "Chief, Compliance Section".
 */
export function addressedTo(document) {
    const section = sectionLabel(document?.destination_section);

    if (!document?.addressee) return section;

    return `${document.addressee}, ${section}`;
}

/**
 * The "FROM" line on the slip: the section that registered the
 * referral. Fixed for the life of the document.
 */
export function sentFrom(document) {
    return sectionLabel(
        document?.creator?.section ?? document?.current_section,
    );
}

/**
 * Who sent it to you *this time*. For a pending document that is the
 * section currently holding it - the one that registered or forwarded
 * it - which may differ from the section that started it off.
 */
export function forwardedBy(document) {
    return sectionLabel(
        document?.current_section ?? document?.creator?.section,
    );
}

/**
 * "September 13, 2026" - the long form used on the printed slip.
 */
export function longDate(date) {
    if (!date) return "";

    return new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(new Date(date));
}

/**
 * "11:38AM 9/14/2026" - the exact moment of a transaction, in the
 * office's own format. Manila time regardless of the phone's setting.
 */
export function exactTime(date) {
    if (!date) return "";

    const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Manila",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            month: "numeric",
            day: "numeric",
            year: "numeric",
        })
            .formatToParts(new Date(date))
            .map((p) => [p.type, p.value]),
    );

    return `${parts.hour}:${parts.minute}${parts.dayPeriod} ${parts.month}/${parts.day}/${parts.year}`;
}

/**
 * "3h", "1d 4h", "35m" - how long a document has been waiting, short
 * enough to sit inside a badge.
 */
export function waitedFor(hours) {
    if (hours == null) return "";

    if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;

    if (hours < 24) return `${Math.round(hours)}h`;

    const days = Math.floor(hours / 24);
    const rest = Math.round(hours - days * 24);

    return rest > 0 ? `${days}d ${rest}h` : `${days}d`;
}
