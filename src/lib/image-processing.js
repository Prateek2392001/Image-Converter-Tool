import JSZip from "jszip";

export async function processImage(file, settings) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let width = img.width;
            let height = img.height;

            if (settings.resize) {
                width = Math.round(width * settings.scale);
                height = Math.round(height * settings.scale);
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            // Better quality resizing
            // ctx.imageSmoothingEnabled = true;
            // ctx.imageSmoothingQuality = "high";

            ctx.drawImage(img, 0, 0, width, height);

            // Determine format
            let format = settings.format;
            if (format === "original") {
                format = file.type;
                // Fallback if file type is not supported by toBlob
                if (!["image/png", "image/jpeg", "image/webp"].includes(format)) {
                    format = "image/jpeg"; // Default fallback
                }
            }

            // For PNG, quality is often ignored by standard toBlob, but we pass it anyway.
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Canvas toBlob failed"));
                    }
                },
                format,
                settings.quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image"));
        };

        img.src = url;
    });
}

export async function generateFaviconPack(file) {
    const sizes = [16, 32, 48, 180, 192, 512];
    const zip = new JSZip();

    // Load image once
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
    });
    URL.revokeObjectURL(url);

    // Generate PNGs for each size
    for (const size of sizes) {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        // Use high quality resizing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0, size, size);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));

        let filename = `favicon-${size}x${size}.png`;
        if (size === 180) filename = `apple-touch-icon.png`;
        if (size === 192) filename = `android-chrome-192x192.png`;
        if (size === 512) filename = `android-chrome-512x512.png`;
        if (size === 32) {
            // We'll also save 32x32 as favicon.ico for basic compatibility
            // Note: This is a PNG with .ico extension, which works in many modern contexts but isn't a true ICO.
            // For a true ICO, we'd need binary manipulation.
            // Let's just provide the PNGs for now and maybe a 32x32 named favicon.ico for convenience.
            zip.file("favicon.ico", blob);
        }

        zip.file(filename, blob);
    }

    // Add a simple webmanifest
    const webmanifest = {
        name: "My App",
        short_name: "App",
        icons: [
            { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
        ],
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone"
    };

    zip.file("site.webmanifest", JSON.stringify(webmanifest, null, 2));

    return zip.generateAsync({ type: "blob" });
}
