
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
