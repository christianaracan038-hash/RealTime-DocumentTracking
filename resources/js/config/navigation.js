/*
 * Sidebar menus, keyed by the employee's section_name in uppercase.
 *
 * Every section gets the same items; only the dashboard route differs.
 * Registering a referral is not here - it opens from the dashboard,
 * where the rest of the section's work already is.
 *
 * Keep the keys in step with config/section.php - a section missing from
 * there cannot log in, and one missing from here gets an empty sidebar.
 */

const sectionMenu = (dashboardRoute, extras = []) => [
    {
        label: "Dashboard",
        route: dashboardRoute,
        icon: "dashboard",
    },
    {
        label: "Referrals",
        route: "referrals.index",
        icon: "referrals",
    },
    {
        label: "Documents",
        route: "documents.index",
        icon: "documents",
    },
    ...extras,
    {
        label: "Comments",
        route: "comments.inbox",
        icon: "comment",

        // The number of notes nobody here has read yet.
        badge: "unreadComments",
    },
    {
        label: "History",
        route: "documents.history",
        icon: "history",
    },
];

/*
 * The RDO's oversight screens, slotted in before History. Most
 * transactions start and end there, so it is the office that chases
 * documents stuck elsewhere and keeps the archive. Both routes check
 * the section server-side too; this only keeps them out of everyone
 * else's sidebar.
 */
const oversight = [
    {
        label: "Comments",
        route: "comments.index",
        icon: "comment",
    },
    {
        label: "Archive",
        route: "archive.index",
        icon: "archive",
    },
];

/*
 * The RDO sends the notes rather than receiving them, so it gets the
 * oversight screen in place of an inbox.
 */
const withoutInbox = (items) =>
    items.filter((item) => item.route !== "comments.inbox");

const navigation = {
    RDO: withoutInbox(sectionMenu("rdo.dashboard", oversight)),
    ASSESSMENT: sectionMenu("assessment.dashboard"),
    CSS: sectionMenu("css.dashboard"),
    COLLECTION: sectionMenu("collection.dashboard"),
    COMPLIANCE: sectionMenu("compliance.dashboard"),
    ADMIN: sectionMenu("admin-section.dashboard"),
};

export default navigation;
