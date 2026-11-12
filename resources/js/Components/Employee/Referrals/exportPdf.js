const MAX_BYTES = 5 * 1024 * 1024;

const ATTEMPTS = [
    { pixelRatio: 3, quality: 0.92 },
    { pixelRatio: 2, quality: 0.85 },
    { pixelRatio: 2, quality: 0.7 },
    { pixelRatio: 1.5, quality: 0.6 },
];

export function formatMb(bytes) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function buildSlipPdf(node, dimensions) {
    if (!node) {
        throw new Error("PDF content is unavailable");
    }

    // Wait for images to finish loading.
    const images = Array.from(node.querySelectorAll("img"));

    await Promise.all(
        images.map((img) => {
            if (img.complete) return Promise.resolve();

            return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        }),
    );

    const [{ toJpeg }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
    ]);

    let finalPdf = null;

    for (const { pixelRatio, quality } of ATTEMPTS) {
        const jpeg = await toJpeg(node, {
            pixelRatio,
            quality,
            backgroundColor: "#ffffff",
            cacheBust: true,
        });

        const pdf = new jsPDF({
            unit: "in",
            format: [dimensions.width, dimensions.height],
            orientation: dimensions.orientation,
            compress: true,
        });

        pdf.addImage(
            jpeg,
            "JPEG",
            0,
            0,
            dimensions.width,
            dimensions.height,
            undefined,
            "FAST",
        );

        const bytes = pdf.output("blob").size;

        if (bytes <= MAX_BYTES) {
            finalPdf = { pdf, bytes };
            break;
        }
    }

    if (!finalPdf) {
        throw new Error("PDF is larger than 5 MB");
    }

    return finalPdf;
}
