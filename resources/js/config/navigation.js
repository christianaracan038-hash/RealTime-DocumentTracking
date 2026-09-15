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

const sectionMenu = (dashboardRoute) => [
    {
        label: "Dashboard",
        route: dashboardRoute,
    },
    {
        label: "Documents",
        route: "documents.index",
    },
    {
        label: "History",
        route: "documents.history",
    },
];

const navigation = {
    RDO: sectionMenu("rdo.dashboard"),
    ASSESSMENT: sectionMenu("assessment.dashboard"),
    CSS: sectionMenu("css.dashboard"),
    COLLECTION: sectionMenu("collection.dashboard"),
    COMPLIANCE: sectionMenu("compliance.dashboard"),
    ADMIN: sectionMenu("admin-section.dashboard"),
};

export default navigation;
