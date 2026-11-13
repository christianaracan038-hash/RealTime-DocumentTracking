const sectionMenu = (dashboardRoute, extras = []) => [
    {
        label: "Dashboard",
        route: dashboardRoute,
        icon: "dashboard",
    },
    {
        label: "Referral",
        route: "referrals.index",
        icon: "referrals",
        badge: "awaitingDetailsCount",
    },
    ...extras,
    {
        label: "Archive",
        route: "archive.index",
        icon: "archive",
        permission: "can_archive",
    },
    {
        label: "Comments",
        route: "comments.inbox",
        icon: "comment",
        badge: "unreadComments",
    },
    {
        label: "History",
        route: "documents.history",
        icon: "history",
    },
];

const oversight = [
    {
        label: "Comments",
        route: "comments.index",
        icon: "comment",
    },
];

const withoutInbox = (items) =>
    items.filter((item) => item.route !== "comments.inbox");

export const registrationMenu = [
    {
        label: "Register a referral",
        route: "registration.index",
        icon: "register",
    },
];

const navigation = {
    "OFFICE OF THE RDO/ARDO": withoutInbox(
        sectionMenu("rdo.dashboard", oversight),
    ),
    ASSESSMENT: sectionMenu("assessment.dashboard"),
    CSS: sectionMenu("css.dashboard"),
    COLLECTION: sectionMenu("collection.dashboard"),
    COMPLIANCE: sectionMenu("compliance.dashboard"),
    ADMIN: sectionMenu("admin-section.dashboard"),
    "GS DORION": sectionMenu("gs-dorion.dashboard"),
    "ASSESSMENT-GS-DORION": sectionMenu("gs-dorion-assessment.dashboard"),
    "ASSESSMENT-GS-INSOY": sectionMenu("gs-insoy.dashboard"),
    "ASSESSMENT-GS-NGO": sectionMenu("gs-ngo.dashboard"),
    "ASSESSMENT-GS-GAWAEN": sectionMenu("gs-gawaen.dashboard"),
    "ASSESSMENT-GS-ORFIANO": sectionMenu("gs-orfiano.dashboard"),
    "ASSESSMENT-GS-DAVID": sectionMenu("gs-david.dashboard"),
};

export default navigation;
