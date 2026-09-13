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
 * The "FROM" line: the section that registered the referral.
 */
export function sentFrom(document) {
    return sectionLabel(
        document?.creator?.section ?? document?.current_section,
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
