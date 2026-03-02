import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import pptxgen from 'pptxgenjs';
import * as XLSX from 'xlsx';

// Initialize PDF.js worker using a CDN to avoid Next.js build configuration issues
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
}

// Extract text from a basic PDF using pdfjs
export async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + "\n\n";
    }
    return fullText;
}

// Render PDF pages to Blobs (JPGs)
export async function pdfToImages(file, scale = 2.0) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
        images.push(blob);
    }
    return images;
}

// Convert PDF to DOCX Blob
export async function convertPdfToDocxBlob(file) {
    const text = await extractTextFromPDF(file);
    const doc = new Document({
        sections: [{
            children: text.split('\n\n').map(p => new Paragraph({
                children: [new TextRun(p)]
            }))
        }]
    });
    return await Packer.toBlob(doc);
}

// Convert PDF to PPTX Blob
export async function convertPdfToPptxBlob(file) {
    const text = await extractTextFromPDF(file);
    let pres = new pptxgen();
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);

    if (paragraphs.length === 0) {
        let slide = pres.addSlide();
        slide.addText("No extractable text found in PDF", { x: 1, y: 1, w: "80%", h: 2, fontSize: 18 });
    } else {
        for (let i = 0; i < Math.min(paragraphs.length, 50); i++) { // limit to 50 slides
            let slide = pres.addSlide();
            slide.addText(paragraphs[i].substring(0, 500) + (paragraphs[i].length > 500 ? "..." : ""), { x: 1, y: 1, w: "80%", h: "80%", fontSize: 14 });
        }
    }

    const buffer = await pres.write({ outputType: 'blob' });
    return buffer;
}

// Convert PDF to Excel Blob (Basic text to rows)
export async function convertPdfToExcelBlob(file) {
    const text = await extractTextFromPDF(file);
    const rows = text.split('\n').map(line => line.split(/\s{2,}/)); // split by 2+ spaces as columns

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Helper to convert hex to pdf-lib rgb
function hexToColor(hex) {
    if (!hex) return rgb(0, 0, 0);
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
}

// Edit PDF Blob (Supports text, images, and signatures)
export async function getEditedPdfBlob(file, modifications = []) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();

    for (const mod of modifications) {
        if (mod.pageIndex >= pages.length || mod.pageIndex < 0) continue;
        const page = pages[mod.pageIndex];
        const { width, height } = page.getSize();

        for (const el of mod.elements) {
            const x = el.pctX * width;
            const y = el.pctY * height;

            if (el.type === 'text') {
                page.drawText(el.text, {
                    x: x,
                    // pdf-lib Y coordinate starts from bottom, adjust based on browser DOM (top-left)
                    y: height - y - (el.fontSize || 24),
                    size: el.fontSize || 24,
                    font: helveticaFont,
                    color: hexToColor(el.color),
                });
            } else if (el.type === 'image' || el.type === 'signature') {
                try {
                    const imgBytes = await fetch(el.dataUrl).then(res => res.arrayBuffer());
                    let img;
                    if (el.dataUrl.startsWith('data:image/png') || el.dataUrl.includes('png')) {
                        img = await pdfDoc.embedPng(imgBytes);
                    } else {
                        img = await pdfDoc.embedJpg(imgBytes);
                    }

                    const elWidth = el.pctWidth * width;
                    const elHeight = (img.height / img.width) * elWidth; // Maintain aspect ratio based on width

                    page.drawImage(img, {
                        x: x,
                        y: height - y - elHeight,
                        width: elWidth,
                        height: elHeight,
                    });
                } catch (err) {
                    console.error("Failed to embed image:", err);
                }
            }
        }
    }

    const modifiedPdfBytes = await pdfDoc.save();
    return new Blob([modifiedPdfBytes], { type: "application/pdf" });
}

// Compress PDF Blob (Rasterize it)
export async function getCompressedPdfBlob(file) {
    // Compress by rasterizing at lower quality (1.0 scale) and rebuilding PDF. 
    const images = await pdfToImages(file, 0.4);

    const pdfDoc = await PDFDocument.create();
    for (const imageBlob of images) {
        const imageBuffer = await imageBlob.arrayBuffer();
        const img = await pdfDoc.embedJpg(imageBuffer);
        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(img, {
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
        });
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
}

// Convert multiple JPGs to one PDF Blob
export async function convertJpgsToPdfBlob(files) {
    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let img;
        if (file.type.includes("png")) {
            img = await pdfDoc.embedPng(arrayBuffer);
        } else {
            img = await pdfDoc.embedJpg(arrayBuffer);
        }

        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(img, {
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
        });
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
}
