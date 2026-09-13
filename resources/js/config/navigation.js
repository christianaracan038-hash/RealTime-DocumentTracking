/*
 * Sidebar menus, keyed by the employee's section_name in uppercase.
 *
 * Every section gets the same four items; only the dashboard route
 * differs. Keep the keys in step with config/section.php — a section
 * missing from there cannot log in, and one missing from here gets an
 * empty sidebar.
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
        label: "Register Document",
        route: "documents.create",
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
};

export default navigation;
