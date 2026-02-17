
export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
        image.src = url
    })

function getRadianAngle(degreeValue) {
    return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width, height, rotation) {
    const rotRad = getRadianAngle(rotation)

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    }
}

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 */
export default async function getCroppedImg(
    imageSrc,
    pixelCrop,
    rotation = 0,
    flip = { horizontal: false, vertical: false },
    shape = 'rect' // 'rect' or 'round'
) {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        return null
    }

    const rotRad = getRadianAngle(rotation)

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    )

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth
    canvas.height = bBoxHeight

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
    ctx.rotate(rotRad)
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
    ctx.translate(-image.width / 2, -image.height / 2)

    // draw rotated image
    ctx.drawImage(image, 0, 0)

    // croppedAreaPixels values are bounding box relative
    // extract the cropped image using these values
    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
    )

    // set canvas width to final desired crop size - this will clear existing context
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // paste generated rotate image at the top left corner
    ctx.putImageData(data, 0, 0)

    // If round/circle, apply masking
    if (shape === 'round') {
        ctx.globalCompositeOperation = "destination-in";
        ctx.beginPath();
        ctx.arc(
            canvas.width / 2,
            canvas.height / 2,
            Math.min(canvas.width, canvas.height) / 2,
            0,
            2 * Math.PI
        );
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
    }

    // Return as Blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            resolve(blob)
        }, 'image/png')
    })
}

/**
 * Generates an image fitted into a canvas of specific aspect ratio with background.
 */
export async function generateCanvasImage(
    imageSrc,
    aspectRatio, // width / height
    background = { type: 'color', value: '#ffffff' }, // or type: 'blur'
    padding = 0, // 0 to 1 (percentage of canvas dimension)
    rotation = 0
) {
    const image = await createImage(imageSrc);
    // Determine canvas size. We want high res.
    // If aspect is 1 (square), utilize max dimension of image?
    // Let's target at least 1080px short edge for high quality.

    let canvasWidth, canvasHeight;

    // Base scale on image natural dimensions to avoid pixelation
    // If image is 500x500 and user wants 1080x1080 canvas, we upscale? Yes.
    // Or we stick to image logic.
    // Let's use a standard "export" size base of 1920 or 1080.
    const baseSize = Math.max(image.naturalWidth, image.naturalHeight, 1080);

    if (aspectRatio >= 1) {
        // Landscape or Square
        canvasWidth = baseSize;
        canvasHeight = baseSize / aspectRatio;
    } else {
        // Portrait
        canvasHeight = baseSize;
        canvasWidth = baseSize * aspectRatio;
    }

    // Round dimensions
    canvasWidth = Math.round(canvasWidth);
    canvasHeight = Math.round(canvasHeight);

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    // 1. Draw Background
    if (background.type === 'color') {
        ctx.fillStyle = background.value;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (background.type === 'blur') {
        // Draw blurred version of image covering canvas
        ctx.save();
        ctx.filter = "blur(40px)";
        // Draw cover logic
        const imgRatio = image.width / image.height;
        const canvasRatio = canvasWidth / canvasHeight;
        let drawW, drawH, offX, offY;

        if (imgRatio > canvasRatio) {
            drawH = canvasHeight;
            drawW = image.width * (canvasHeight / image.height);
            offX = (canvasWidth - drawW) / 2;
            offY = 0;
        } else {
            drawW = canvasWidth;
            drawH = image.height * (canvasWidth / image.width);
            offX = 0;
            offY = (canvasHeight - drawH) / 2;
        }
        // Scale for better blur coverage (remove edges)
        ctx.scale(1.1, 1.1);
        ctx.translate(-canvasWidth * 0.05, -canvasHeight * 0.05);

        ctx.drawImage(image, offX, offY, drawW, drawH);
        ctx.restore();

        // Add a slight dark overlay to pop the content
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 2. Draw Image (Fitted)
    ctx.save();

    // Apply Rotation around center of image placement?
    // For simplicity in "Fit" mode, we might disable rotation or handle it by rotating valid context.
    // Let's handle simple rotation if needed, but 'Fit' usually implies just placing.
    // If rotation is passed, we must rotate context at center.
    if (rotation !== 0) {
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.rotate(getRadianAngle(rotation));
        ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
    }

    // Calculate fit dimensions
    // Effective area after padding
    // Padding is relative to the smaller dimension
    const pVal = Math.min(canvasWidth, canvasHeight) * padding;
    const availW = canvasWidth - (pVal * 2);
    const availH = canvasHeight - (pVal * 2);

    const imgRatio = image.width / image.height;
    const availRatio = availW / availH;

    let finalW, finalH, finalX, finalY;

    if (imgRatio > availRatio) {
        // Image is wider than slot -> fit width
        finalW = availW;
        finalH = availW / imgRatio;
    } else {
        // Image is taller than slot -> fit height
        finalH = availH;
        finalW = availH * imgRatio;
    }

    // Center it
    finalX = (canvasWidth - finalW) / 2;
    finalY = (canvasHeight - finalH) / 2;

    // Optional shadow for "Fit" mode to separate from background
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;

    ctx.drawImage(image, finalX, finalY, finalW, finalH);
    ctx.restore();

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, "image/png");
    });
}
