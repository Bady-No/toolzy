import JSZip from 'jszip';

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function calculateSavings(orig: number, comp: number): { percent: number; savedBytes: number } {
  if (orig <= 0 || comp >= orig) {
    return { percent: 0, savedBytes: 0 };
  }
  const savedBytes = orig - comp;
  const percent = Math.round((savedBytes / orig) * 100);
  return { percent, savedBytes };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function createAndDownloadZip(
  files: Array<{ blob: Blob; name: string }>,
  zipName = 'toolbox-files.zip'
): Promise<void> {
  const zip = new JSZip();
  files.forEach(({ blob, name }, index) => {
    // Avoid duplicate names
    const safeName = name || `file-${index + 1}`;
    zip.file(safeName, blob);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(content, zipName);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));
    img.src = src;
  });
}

/**
 * Watermarks removed - all processed images are 100% clean and watermark-free
 */
export function applyWatermark(
  _ctx: CanvasRenderingContext2D,
  _width: number,
  _height: number,
  _text = 'Toolzy'
): void {
  // Watermark removed per user request
}

