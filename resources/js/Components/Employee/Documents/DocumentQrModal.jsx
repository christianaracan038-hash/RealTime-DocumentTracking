export default function DocumentQrModal({ document, onClose }) {
    if (!document) {
        return null;
    }

    const qrUrl = `/${document.qr_path}`;

    const handleDownload = async () => {
        try {
            const response = await fetch(qrUrl);

            if (!response.ok) {
                throw new Error("Unable to download QR code.");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = window.document.createElement("a");
            link.href = url;
            link.download = `${document.tracking_number}-QR.png`;

            window.document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("QR DOWNLOAD ERROR:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Document QR Code
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {document.tracking_number}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-2xl leading-none text-slate-400 hover:text-slate-700"
                    >
                        ×
                    </button>
                </div>

                {/* QR */}
                <div className="px-6 py-6">
                    <div className="flex justify-center">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <img
                                src={qrUrl}
                                alt={`QR Code for ${document.tracking_number}`}
                                className="h-64 w-64 object-contain"
                            />
                        </div>
                    </div>

                    {/* Document information */}
                    <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Tracking Number
                            </p>

                            <p className="mt-1 font-semibold text-slate-800">
                                {document.tracking_number}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Description
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                                {document.description || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Destination
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                                {document.destination_section?.section_name ||
                                    "-"}
                            </p>
                        </div>
                    </div>

                    {/* Download */}
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="mt-5 w-full rounded-lg bg-green-600 px-4 py-2.5 font-medium text-white transition hover:bg-green-700"
                    >
                        Download QR Code
                    </button>
                </div>
            </div>
        </div>
    );
}
