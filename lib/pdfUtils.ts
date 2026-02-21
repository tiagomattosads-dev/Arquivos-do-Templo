export async function extractPdfCover(file: File): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined;
  
  try {
    const pdfjs = await import('pdfjs-dist');
    
    // Set worker URL
    const pdfjsVersion = pdfjs.version || '5.4.624';
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Get the first page
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 }); // Scale down for thumbnail
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas
    }).promise;
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return dataUrl;
  } catch (error) {
    console.error('Error extracting PDF cover:', error);
    return undefined;
  }
}
