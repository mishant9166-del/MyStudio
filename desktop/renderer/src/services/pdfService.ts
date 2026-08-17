import * as pdfjsLib from 'pdfjs-dist';

// Use the local worker file from pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const pdfCache = new Map<string, pdfjsLib.PDFDocumentProxy>();
const pageCache = new Map<string, HTMLCanvasElement>();

export const getPdfPageAsCanvas = async (base64Data: string, pageNumber: number): Promise<{ canvas: HTMLCanvasElement, totalPages: number } | null> => {
  try {
    let pdfDoc = pdfCache.get(base64Data.substring(0, 100));
    
    if (!pdfDoc) {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
      pdfCache.set(base64Data.substring(0, 100), pdfDoc);
    }

    const totalPages = pdfDoc.numPages;
    const cacheKey = `${base64Data.substring(0, 100)}_${pageNumber}`;
    if (pageCache.has(cacheKey)) {
      return { canvas: pageCache.get(cacheKey)!, totalPages };
    }

    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2.0 }); // Render at 2x scale for quality

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: ctx,
      viewport: viewport
    } as any).promise;

    pageCache.set(cacheKey, canvas);
    return { canvas, totalPages };
  } catch (error) {
    console.error('Failed to render PDF page:', error);
    return null;
  }
};
