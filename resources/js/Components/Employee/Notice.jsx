import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import EmployeeButton from "./EmployeeButton";
import Icon from "./Icon";
import { exactTime } from "./Referrals/referral";

/*
 * A formal confirmation that something happened.
 *
 * Staff scanning at a counter need to know, unmistakably, that the
 * document was received / forwarded / completed - not infer it from a
 * dialog closing. This shows a large check, what happened, to which
 * document, and the exact time, and waits for "Done". It also closes
 * itself after a while so a forgotten phone does not sit on it forever.
 *
 * Any component can call `useNotice().notify({...})`; the provider
 * wraps the whole app in app.jsx so it works from inside dialogs too.
 */

const NoticeContext = createContext(() => {});

const AUTO_CLOSE_MS = 12000;

export function useNotice() {
    return { notify: useContext(NoticeContext) };
}

export function NoticeProvider({ children }) {
    const [notice, setNotice] = useState(null);

    const notify = useCallback((next) => {
        setNotice({ ...next, at: new Date().toISOString() });
    }, []);

    return (
        <NoticeContext.Provider value={notify}>
            {children}

            {notice && (
                <SuccessNotice notice={notice} onDone={() => setNotice(null)} />
            )}
        </NoticeContext.Provider>
    );
}

function SuccessNotice({ notice, onDone }) {
    useEffect(() => {
        const timer = setTimeout(onDone, AUTO_CLOSE_MS);

        const onKey = (e) =>
            (e.key === "Escape" || e.key === "Enter") && onDone();
        window.addEventListener("keydown", onKey);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("keydown", onKey);
        };
    }, [notice]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-navy-950/60 p-4 sm:items-center"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="notice-title"
        >
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* The unmistakable part */}
                <div className="flex flex-col items-center bg-ok-600 px-6 pt-8 pb-6 text-center text-white">
                    <span
                        aria-hidden="true"
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20"
                    >
                        <Icon name="check" className="text-4xl" />
                    </span>

                    <h2 id="notice-title" className="mt-4 text-2xl font-bold">
                        {notice.title}
                    </h2>

                    {notice.message && (
                        <p className="mt-1 text-base text-white/85">
                            {notice.message}
                        </p>
                    )}
                </div>

                {/* What it was about */}
                {notice.details?.length > 0 && (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-6 py-5 text-base">
                        {notice.details
                            .filter(([, value]) => value)
                            .map(([label, value]) => (
                                <div key={label} className="contents">
                                    <dt className="text-sm font-semibold text-muted">
                                        {label}
                                    </dt>
                                    <dd className="font-medium text-navy-900">
                                        {value}
                                    </dd>
                                </div>
                            ))}

                        <div className="contents">
                            <dt className="text-sm font-semibold text-muted">
                                Time
                            </dt>
                            <dd className="font-medium text-navy-900">
                                {exactTime(notice.at)}
                            </dd>
                        </div>
                    </dl>
                )}

                <div className="border-t border-line px-6 py-4">
                    <EmployeeButton
                        size="lg"
                        onClick={onDone}
                        className="w-full"
                        autoFocus
                    >
                        Done
                    </EmployeeButton>
                </div>
            </div>
        </div>
    );
}
