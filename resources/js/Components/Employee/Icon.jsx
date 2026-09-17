import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowRightArrowLeft,
    faBars,
    faCalendarDays,
    faCheck,
    faChevronLeft,
    faChevronRight,
    faCircleCheck,
    faCircleInfo,
    faClipboardList,
    faClockRotateLeft,
    faFileLines,
    faFilePen,
    faGaugeHigh,
    faMagnifyingGlass,
    faPaperPlane,
    faPlus,
    faPrint,
    faQrcode,
    faRightFromBracket,
    faTriangleExclamation,
    faUser,
    faUsers,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

/*
 * Every icon in the portal, named for what it means rather than what it
 * looks like.
 *
 * Font Awesome is installed as a package and bundled with the app - no
 * CDN - so the icons work on a restricted office network and offline.
 * Only the icons listed here end up in the build, which keeps it small.
 *
 * Adding one: import it above and give it a name below. Nothing else in
 * the app imports Font Awesome directly, so swapping the icon set later
 * means editing this one file.
 */

const ICONS = {
    // Navigation
    dashboard: faGaugeHigh,
    documents: faFileLines,
    referrals: faClipboardList,
    history: faClockRotateLeft,
    menu: faBars,

    // Actions
    search: faMagnifyingGlass,
    add: faPlus,
    scan: faQrcode,
    print: faPrint,
    forward: faPaperPlane,
    complete: faCircleCheck,
    register: faFilePen,
    close: faXmark,
    logout: faRightFromBracket,

    // People
    user: faUser,
    people: faUsers,

    // Meaning
    check: faCheck,
    date: faCalendarDays,
    info: faCircleInfo,
    warning: faTriangleExclamation,
    movement: faArrowRightArrowLeft,

    // Paging
    previous: faChevronLeft,
    next: faChevronRight,
};

export default function Icon({ name, className = "", ...props }) {
    const icon = ICONS[name];

    if (!icon) return null;

    return (
        <FontAwesomeIcon
            icon={icon}
            className={className}
            aria-hidden="true"
            {...props}
        />
    );
}
