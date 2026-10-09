import { useState } from "react";
import ReceiveDocumentScanner from "./RecieveDocumentScanner";

const ADMIN_ACTIONS = ["Chief", "Archive"];

export default function ForwardDocumentModal({
    document,
    onClose,
    onForwarded = null,
}) {
    const [showScanner, setShowScanner] = useState(false);

    const [verifiedDocument, setVerifiedDocument] = useState(null);
    const [sections, setSections] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState("");
    const [adminAction, setAdminAction] = useState("");

    const [forwarding, setForwarding] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    if (!document) {
        return null;
    }

    const selectedSection = sections.find(
        (s) => String(s.section_id) === String(selectedSectionId),
    );

    const isAdminDestination =
        selectedSection?.section_code?.toUpperCase() === "ADMIN" ||
        selectedSection?.section_name?.toUpperCase() === "ADMIN";

    const isArchiving = isAdminDestination && adminAction === "Archive";

    const handleSectionChange = (value) => {
        setSelectedSectionId(value);
        setAdminAction("");
    };

    const handleForward = async () => {
        if (!verifiedDocument) {
            setError("Please scan and verify the document first.");
            return;
        }

        if (!selectedSectionId) {
            setError("Please select a destination section.");
            return;
        }

        if (isAdminDestination && !adminAction) {
            setError("Please choose Chief or Archive.");
            return;
        }

        try {
            setForwarding(true);
            setError(null);

            const csrfToken = window.document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content");

            const response = await fetch(
                `/api/documents/${verifiedDocument.document_id}/forward`,
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
                    },
                    body: JSON.stringify({
                        destination_section_id: selectedSectionId,
                        addressee: isAdminDestination ? adminAction : null,
                        archive: isArchiving,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to forward the document.",
                );
            }

            setSuccess(true);
            setForwarding(false);

            if (onForwarded) {
                onForwarded(
                    data.document ?? verifiedDocument,
                    selectedSection ?? null,
                );
            } else {
                setTimeout(onClose, 1500);
            }
        } catch (err) {
            setError(
                err.message ||
                    "Something went wrong while forwarding the document.",
            );

            setForwarding(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-navy-950/70 p-4 sm:items-center">
                <div className="w-full max-w-lg rounded-xl bg-surface shadow-xl">
                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">
                                Forward Document
                            </h2>

                            <p className="text-sm text-slate-500">
                                Verify the document and select where it will be
                                forwarded.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={forwarding}
                            className="text-xl text-slate-400 hover:text-slate-700 disabled:opacity-50"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-4 px-6 py-5">
                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Taxpayer
                            </p>

                            <p className="text-lg font-semibold text-slate-900">
                                {document.taxpayer_name ??
                                    "No taxpayer on record"}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-slate-400">
                                    Reference No.
                                </p>

                                <p className="font-semibold text-slate-800">
                                    {document.tracking_number}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-slate-400">
                                    Concern
                                </p>

                                <p className="text-slate-700">
                                    {document.concern ??
                                        document.transaction_type ??
                                        "—"}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Remarks
                            </p>

                            <p className="text-slate-700">
                                {document.remarks ?? document.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-slate-400">
                                    Current Section
                                </p>

                                <p className="font-medium text-slate-700">
                                    {document.current_section?.section_name ??
                                        "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-slate-400">
                                    Current Employee
                                </p>

                                <p className="font-medium text-slate-700">
                                    {document.current_employee?.username ?? "—"}
                                </p>
                            </div>
                        </div>

                        {!verifiedDocument && (
                            <div className="rounded-lg bg-blue-50 p-4">
                                <p className="text-sm font-medium text-blue-800">
                                    Step 1 — Verify Document
                                </p>

                                <p className="mt-1 text-sm text-blue-600">
                                    Scan the QR code attached to the physical
                                    document.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setError(null);
                                        setShowScanner(true);
                                    }}
                                    className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    Scan Document QR
                                </button>
                            </div>
                        )}

                        {verifiedDocument && !success && (
                            <div className="rounded-lg bg-green-50 p-4">
                                <p className="text-sm font-semibold text-green-800">
                                    ✓ Document Verified
                                </p>

                                <p className="mt-1 text-sm text-green-700">
                                    The document QR code is valid and can be
                                    forwarded.
                                </p>
                            </div>
                        )}

                        {verifiedDocument && !success && (
                            <div>
                                <label
                                    htmlFor="destination-section"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Destination Section
                                </label>

                                <select
                                    id="destination-section"
                                    value={selectedSectionId}
                                    onChange={(e) =>
                                        handleSectionChange(e.target.value)
                                    }
                                    disabled={forwarding}
                                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                >
                                    <option value="">
                                        Select destination section
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

                                {sections.length === 0 && (
                                    <p className="mt-2 text-sm text-red-600">
                                        No available destination sections found.
                                    </p>
                                )}
                            </div>
                        )}

                        {verifiedDocument && !success && isAdminDestination && (
                            <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                                <p className="text-sm font-semibold text-slate-800">
                                    Forward to Admin for
                                </p>

                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    {ADMIN_ACTIONS.map((option) => {
                                        const selected = adminAction === option;

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
                                                    name="admin-action"
                                                    value={option}
                                                    checked={selected}
                                                    onChange={() =>
                                                        setAdminAction(option)
                                                    }
                                                    className="h-4 w-4 text-blue-600"
                                                />
                                                {option}
                                            </label>
                                        );
                                    })}
                                </div>

                                {isArchiving && (
                                    <p className="mt-3 text-sm text-amber-700">
                                        Admin has to receive this document
                                        first. It will be archived as soon as
                                        Admin receives it, and you will be
                                        recorded as the one who forwarded it for
                                        archiving.
                                    </p>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="rounded-lg bg-green-50 p-4 text-center">
                                <div className="text-4xl">✓</div>

                                <p className="mt-2 font-semibold text-green-700">
                                    {isArchiving
                                        ? "Forwarded for Archiving"
                                        : "Document Forwarded Successfully"}
                                </p>

                                <p className="mt-1 text-sm text-green-600">
                                    {isArchiving
                                        ? "It will be archived once Admin receives it."
                                        : "Tracking history has been recorded."}
                                </p>
                            </div>
                        )}
                    </div>

                    {!success && (
                        <div className="flex justify-end gap-3 border-t px-6 py-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={forwarding}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            {verifiedDocument && (
                                <button
                                    type="button"
                                    onClick={handleForward}
                                    disabled={
                                        forwarding ||
                                        !selectedSectionId ||
                                        (isAdminDestination && !adminAction)
                                    }
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {forwarding
                                        ? "Forwarding..."
                                        : isArchiving
                                          ? "Forward for Archiving"
                                          : "Forward Document"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showScanner && (
                <ReceiveDocumentScanner
                    document={document}
                    mode="forward"
                    onClose={() => setShowScanner(false)}
                    onForwarded={(scannedDocument, availableSections) => {
                        setVerifiedDocument(scannedDocument);
                        setSections(availableSections || []);
                        setSelectedSectionId("");
                        setAdminAction("");
                        setShowScanner(false);
                        setError(null);
                    }}
                />
            )}
        </>
    );
}
