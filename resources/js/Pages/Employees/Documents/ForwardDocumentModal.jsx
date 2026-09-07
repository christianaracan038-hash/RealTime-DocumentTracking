import { useState } from "react";
import ReceiveDocumentScanner from "./RecieveDocumentScanner";

export default function ForwardDocumentModal({ document, onClose }) {
    const [showScanner, setShowScanner] = useState(false);

    const [verifiedDocument, setVerifiedDocument] = useState(null);
    const [sections, setSections] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState("");

    const [forwarding, setForwarding] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    if (!document) {
        return null;
    }

    const handleForward = async () => {
        if (!verifiedDocument) {
            setError("Please scan and verify the document first.");
            return;
        }

        if (!selectedSectionId) {
            setError("Please select a destination section.");
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

                        ...(csrfToken
                            ? {
                                  "X-CSRF-TOKEN": csrfToken,
                              }
                            : {}),
                    },
                    body: JSON.stringify({
                        destination_section_id: selectedSectionId,
                    }),
                },
            );

            const data = await response.json();

            console.log("FORWARD RESPONSE:", data);

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to forward the document.",
                );
            }

            setSuccess(true);
            setForwarding(false);

            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            console.error("FORWARD ERROR:", err);

            setError(
                err.message ||
                    "Something went wrong while forwarding the document.",
            );

            setForwarding(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                    {/* Header */}
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

                    {/* Document Info */}
                    <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Tracking Number
                            </p>

                            <p className="font-semibold text-slate-800">
                                {document.tracking_number}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-400">
                                Description
                            </p>

                            <p className="text-slate-700">
                                {document.description}
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

                        {/* Scan Button */}
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

                        {/* Verified */}
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

                        {/* Destination */}
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
                                        setSelectedSectionId(e.target.value)
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

                        {/* Error */}
                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Success */}
                        {success && (
                            <div className="rounded-lg bg-green-50 p-4 text-center">
                                <div className="text-4xl">✓</div>

                                <p className="mt-2 font-semibold text-green-700">
                                    Document Forwarded Successfully
                                </p>

                                <p className="mt-1 text-sm text-green-600">
                                    Tracking history has been recorded.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
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
                                    disabled={forwarding || !selectedSectionId}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {forwarding
                                        ? "Forwarding..."
                                        : "Forward Document"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* QR Scanner */}
            {showScanner && (
                <ReceiveDocumentScanner
                    document={document}
                    mode="forward"
                    onClose={() => setShowScanner(false)}
                    onForwarded={(scannedDocument, availableSections) => {
                        console.log("VERIFIED DOCUMENT:", scannedDocument);

                        console.log("AVAILABLE SECTIONS:", availableSections);

                        setVerifiedDocument(scannedDocument);

                        setSections(availableSections || []);

                        setSelectedSectionId("");
                        setShowScanner(false);
                        setError(null);
                    }}
                />
            )}
        </>
    );
}
