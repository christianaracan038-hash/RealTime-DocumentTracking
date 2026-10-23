import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const ADMIN_ACTIONS = ["Chief", "Archive"];

const getCsrfToken = () =>
    window.document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content") ?? null;

const apiFetch = async (url, options = {}) => {
    const csrfToken = getCsrfToken();

    const response = await fetch(url, {
        ...options,
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
            ...(options.headers ?? {}),
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "An unexpected error occurred.");
    }

    return data;
};

const errorText = (err, fallback) =>
    (typeof err === "string" ? err : err?.message) || fallback;

const isAdminSection = (section) =>
    section?.section_code?.toUpperCase() === "ADMIN" ||
    section?.section_name?.toUpperCase() === "ADMIN";

export default function BatchDocumentScanner({
    onClose,
    onReceived,
    onForwarded,
    initialMode = "receive",
}) {
    const scannerRef = useRef(null);
    const isMountedRef = useRef(true);
    const modeRef = useRef(initialMode);
    const configRef = useRef({ ready: initialMode === "receive" });
    const queueRef = useRef([]);
    const workingRef = useRef(false);
    const lastSeenRef = useRef(new Map());
    const doneIdsRef = useRef(new Set());
    const successKeysRef = useRef(new Set());
    const counterRef = useRef(0);

    const [mode, setMode] = useState(initialMode);
    const [items, setItems] = useState([]);
    const [sections, setSections] = useState([]);
    const [sectionsLoading, setSectionsLoading] = useState(false);
    const [sectionsError, setSectionsError] = useState(null);
    const [selectedSectionId, setSelectedSectionId] = useState("");
    const [adminAction, setAdminAction] = useState("");
    const [formError, setFormError] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [busy, setBusy] = useState(false);
    const flashTimerRef = useRef(null);
    const [flash, setFlash] = useState(null);

    const isForward = mode === "forward";

    const selectedSection = sections.find(
        (s) => String(s.section_id) === String(selectedSectionId),
    );

    const isAdminDestination = isAdminSection(selectedSection);
    const isArchiving = isAdminDestination && adminAction === "Archive";

    const ready = isForward
        ? Boolean(selectedSectionId) &&
          (!isAdminDestination || Boolean(adminAction))
        : true;

    configRef.current = {
        ready,
        sectionId: selectedSectionId,
        sectionName: selectedSection?.section_name ?? "section",
        addressee: isAdminDestination ? adminAction : null,
        archive: isArchiving,
    };

    const patchItem = (id, patch) => {
        if (!isMountedRef.current) return;
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        );
    };

    const removeItem = (id) => {
        if (!isMountedRef.current) return;
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const feedback = (ok) => {
        navigator.vibrate?.(ok ? 60 : [100, 60, 100]);
    };

    const showFlash = (title, subtitle) => {
        if (!isMountedRef.current) return;

        clearTimeout(flashTimerRef.current);
        setFlash({ title, subtitle });

        flashTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) setFlash(null);
        }, 1300);
    };

    const runJob = async (job) => {
        const { id, lookup, jobMode, key, config } = job;

        try {
            const scanData = await apiFetch("/api/documents/scan", {
                method: "POST",
                body: JSON.stringify({ ...lookup, mode: jobMode }),
            });

            const scanned = scanData.document;

            if (!scanned?.document_id) {
                throw new Error("No valid document found for this code.");
            }

            const docKey = String(scanned.document_id);

            if (doneIdsRef.current.has(docKey)) {
                successKeysRef.current.add(key);
                removeItem(id);
                return;
            }

            const label = scanned.taxpayer_name
                ? `${scanned.taxpayer_name} · ${scanned.tracking_number}`
                : scanned.tracking_number;

            if (jobMode === "forward") {
                const data = await apiFetch(
                    `/api/documents/${scanned.document_id}/forward`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            destination_section_id: config.sectionId,
                            addressee: config.addressee,
                            archive: config.archive,
                        }),
                    },
                );

                doneIdsRef.current.add(docKey);
                successKeysRef.current.add(key);

                patchItem(id, {
                    status: "done",
                    label,
                    message: config.archive
                        ? "Forwarded for archiving"
                        : `Forwarded to ${config.sectionName}`,
                    document: data.document ?? scanned,
                });
                feedback(true);

                showFlash(
                    config.archive
                        ? "Forwarded for Archiving"
                        : "Document Forwarded",
                    label,
                );

                if (onForwarded) onForwarded(data.document ?? scanned);
                return;
            }

            const actionData = await apiFetch(
                `/api/documents/${scanned.document_id}/receive`,
                { method: "POST" },
            );

            doneIdsRef.current.add(docKey);
            successKeysRef.current.add(key);

            patchItem(id, {
                status: "done",
                label,
                message:
                    actionData.message ??
                    (actionData.archived
                        ? "Received and archived"
                        : "Received"),
                document: actionData.document ?? scanned,
            });
            feedback(true);

            showFlash(
                actionData.archived ? "Document Archived" : "Document Received",
                label,
            );

            if (onReceived) onReceived(actionData.document ?? scanned);
        } catch (err) {
            patchItem(id, {
                status: "error",
                message: errorText(err, "Something went wrong."),
            });
            feedback(false);
        }
    };

    const processQueue = async () => {
        if (workingRef.current) return;
        workingRef.current = true;
        if (isMountedRef.current) setBusy(true);

        while (queueRef.current.length > 0 && isMountedRef.current) {
            const job = queueRef.current.shift();
            await runJob(job);
        }

        workingRef.current = false;
        if (isMountedRef.current) setBusy(false);
    };

    const enqueue = (lookup, key) => {
        const config = { ...configRef.current };

        if (!config.ready) return false;
        if (successKeysRef.current.has(key)) return false;

        const now = Date.now();
        const last = lastSeenRef.current.get(key);

        if (last && now - last < 4000) return false;

        lastSeenRef.current.set(key, now);

        counterRef.current += 1;
        const id = counterRef.current;
        const jobMode = modeRef.current;

        setItems((prev) => [
            {
                id,
                key,
                status: "pending",
                label: lookup.tracking_number ?? "Scanning...",
                message: "Checking document...",
                document: null,
                jobMode,
            },
            ...prev,
        ]);

        queueRef.current.push({ id, lookup, jobMode, key, config });
        processQueue();
        return true;
    };

    useEffect(() => {
        isMountedRef.current = true;

        const scanner = new Html5Qrcode("batch-qr-reader");
        scannerRef.current = scanner;

        const start = async () => {
            try {
                setCameraError(null);

                const cameras = await Html5Qrcode.getCameras();

                if (!cameras || cameras.length === 0) {
                    throw new Error("No camera found.");
                }

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: (w, h) => {
                            const edge = Math.min(w, h) * 0.7;
                            return { width: edge, height: edge };
                        },
                        aspectRatio: 1.0,
                    },
                    (decodedText) =>
                        enqueue({ qr_value: decodedText }, decodedText),
                    () => {},
                );
            } catch (err) {
                if (!isMountedRef.current) return;
                setCameraError(
                    errorText(
                        err,
                        "Unable to start the QR scanner. Please check your camera permission.",
                    ),
                );
            }
        };

        start();

        return () => {
            isMountedRef.current = false;
            clearTimeout(flashTimerRef.current);

            const current = scannerRef.current;
            scannerRef.current = null;

            if (!current) return;

            current
                .stop()
                .catch(() => {})
                .finally(() => {
                    try {
                        current.clear();
                    } catch {}
                });
        };
    }, []);

    const loadSections = async () => {
        try {
            setSectionsLoading(true);
            setSectionsError(null);

            const data = await apiFetch("/api/documents/forward-sections");

            if (!isMountedRef.current) return;

            setSections(data.sections ?? []);
        } catch (err) {
            if (!isMountedRef.current) return;

            setSectionsError(errorText(err, "Unable to load sections."));
        } finally {
            if (isMountedRef.current) setSectionsLoading(false);
        }
    };

    useEffect(() => {
        if (isForward && sections.length === 0 && !sectionsLoading) {
            loadSections();
        }
    }, [isForward]);

    const switchMode = (nextMode) => {
        if (busy || nextMode === mode) return;

        modeRef.current = nextMode;
        queueRef.current = [];
        lastSeenRef.current = new Map();
        doneIdsRef.current = new Set();
        successKeysRef.current = new Set();
        setItems([]);
        setSelectedSectionId("");
        setAdminAction("");
        setFormError(null);
        setMode(nextMode);
    };

    const handleSectionChange = (value) => {
        setSelectedSectionId(value);
        setAdminAction("");
        setFormError(null);
    };

    const handleManualSubmit = () => {
        const value = trackingNumber.trim();
        if (!value) return;

        if (!ready) {
            setFormError(
                isAdminDestination
                    ? "Please choose Chief or Archive first."
                    : "Please select a destination section first.",
            );
            return;
        }

        setFormError(null);

        if (enqueue({ tracking_number: value }, `tn:${value}`)) {
            setTrackingNumber("");
        }
    };

    const doneCount = items.filter((item) => item.status === "done").length;
    const errorCount = items.filter((item) => item.status === "error").length;

    return (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-navy-950/80 p-4 sm:items-center">
            <style>{`
            @keyframes scan-progress-bar {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(150%); }
                100% { transform: translateX(400%); }
            }
        `}</style>
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-xl">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Scan QR Code
                        </h2>
                        <p className="text-xs text-slate-500">
                            {isForward
                                ? "Select the destination, then scan documents to forward"
                                : "Scan documents to receive"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xl text-slate-400 hover:text-slate-700"
                    >
                        ×
                    </button>
                </div>

                <div className="p-5">
                    <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                        {["receive", "forward"].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => switchMode(m)}
                                disabled={busy}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize disabled:opacity-50 ${
                                    mode === m
                                        ? "bg-white text-slate-900 shadow"
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    {isForward && (
                        <div className="mb-4 space-y-3">
                            <div>
                                <label
                                    htmlFor="batch-destination-section"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Forward to
                                </label>

                                <select
                                    id="batch-destination-section"
                                    value={selectedSectionId}
                                    onChange={(e) =>
                                        handleSectionChange(e.target.value)
                                    }
                                    disabled={busy || sectionsLoading}
                                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
                                >
                                    <option value="">
                                        {sectionsLoading
                                            ? "Loading sections..."
                                            : "Select destination section"}
                                    </option>

                                    {sections.map((section) => (
                                        <option
                                            key={section.section_id}
                                            value={section.section_id}
                                        >
                                            {section.section_name}
                                        </option>
                                    ))}
                                </select>

                                {sectionsError && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {sectionsError}{" "}
                                        <button
                                            type="button"
                                            onClick={loadSections}
                                            className="font-medium underline"
                                        >
                                            Retry
                                        </button>
                                    </p>
                                )}
                            </div>

                            {isAdminDestination && (
                                <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-3">
                                    <p className="text-sm font-semibold text-slate-800">
                                        Forward to Admin for
                                    </p>

                                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                        {ADMIN_ACTIONS.map((option) => {
                                            const selected =
                                                adminAction === option;

                                            return (
                                                <label
                                                    key={option}
                                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 bg-white px-3 py-2 text-sm font-medium transition ${
                                                        selected
                                                            ? "border-blue-600 text-blue-700"
                                                            : "border-slate-200 text-slate-700 hover:border-blue-200"
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="batch-admin-action"
                                                        value={option}
                                                        checked={selected}
                                                        disabled={busy}
                                                        onChange={() => {
                                                            setAdminAction(
                                                                option,
                                                            );
                                                            setFormError(null);
                                                        }}
                                                        className="h-4 w-4 text-blue-600"
                                                    />
                                                    {option}
                                                </label>
                                            );
                                        })}
                                    </div>

                                    {isArchiving && (
                                        <p className="mt-2 text-xs text-amber-700">
                                            Admin has to receive these documents
                                            first. They will be archived as soon
                                            as Admin receives them, and you will
                                            be recorded as the one who forwarded
                                            them for archiving.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative min-h-[260px] overflow-hidden rounded-xl bg-slate-900">
                        <div id="batch-qr-reader" className="w-full" />

                        {flash && !cameraError && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-600/90">
                                <div className="px-4 text-center text-white">
                                    <div className="text-5xl">✓</div>
                                    <p className="mt-2 text-lg font-semibold">
                                        {flash.title}
                                    </p>
                                    <p className="mt-1 truncate text-sm text-green-100">
                                        {flash.subtitle}
                                    </p>
                                </div>
                            </div>
                        )}

                        {!flash && busy && !cameraError && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
                                <div className="w-52 text-center text-white">
                                    <p className="text-sm font-medium">
                                        {isForward
                                            ? "Forwarding document..."
                                            : "Receiving document..."}
                                    </p>

                                    <div className="mx-auto mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                                        <div
                                            className="h-full w-1/3 rounded-full bg-white"
                                            style={{
                                                animation:
                                                    "scan-progress-bar 1.1s ease-in-out infinite",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {isForward && !ready && !cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/85 p-6 text-center">
                                <p className="text-sm font-medium text-white">
                                    {isAdminDestination
                                        ? "Choose Chief or Archive to start scanning."
                                        : "Select a destination section to start scanning."}
                                </p>
                            </div>
                        )}

                        {cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-6 text-center">
                                <div>
                                    <p className="text-sm text-red-300">
                                        {cameraError}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-400">
                                        You can still enter the tracking number
                                        below.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>
                            {doneCount} {isForward ? "forwarded" : "received"}
                            {errorCount > 0 ? ` · ${errorCount} failed` : ""}
                        </span>
                        {busy && <span>Processing...</span>}
                    </div>

                    <div className="mt-2 max-h-44 space-y-1.5 overflow-y-auto">
                        {items.length === 0 && (
                            <p className="py-3 text-center text-sm text-slate-400">
                                Point the camera at a QR code. Keep scanning,
                                the camera stays on.
                            </p>
                        )}

                        {items.map((item) => (
                            <div
                                key={item.id}
                                className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                                    item.status === "done"
                                        ? "bg-green-50 text-green-800"
                                        : item.status === "error"
                                          ? "bg-red-50 text-red-700"
                                          : "bg-slate-50 text-slate-600"
                                }`}
                            >
                                <span className="mt-0.5">
                                    {item.status === "done"
                                        ? "✓"
                                        : item.status === "error"
                                          ? "✕"
                                          : "…"}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">
                                        {item.label}
                                    </p>
                                    <p className="text-xs opacity-80">
                                        {item.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {formError && (
                        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            {formError}
                        </div>
                    )}

                    <div className="mt-4 border-t pt-4">
                        <label
                            htmlFor="batch-manual-tracking"
                            className="mb-1.5 block text-xs font-medium text-slate-600"
                        >
                            Can't scan the QR code? Enter the tracking number
                            instead.
                        </label>

                        <div className="flex gap-2">
                            <input
                                id="batch-manual-tracking"
                                type="text"
                                value={trackingNumber}
                                onChange={(e) =>
                                    setTrackingNumber(e.target.value)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleManualSubmit();
                                    }
                                }}
                                placeholder="Tracking number"
                                autoComplete="off"
                                disabled={isForward && !ready}
                                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none disabled:bg-slate-100 disabled:opacity-60"
                            />

                            <button
                                type="button"
                                onClick={handleManualSubmit}
                                disabled={!trackingNumber.trim() || !ready}
                                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isForward
                                    ? isArchiving
                                        ? "Forward for Archiving"
                                        : "Forward"
                                    : "Receive"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                    >
                        {doneCount > 0 ? "Done" : "Cancel"}
                    </button>
                </div>
            </div>
        </div>
    );
}
