import { loadImage, applyWatermark } from './fileUtils';
import { PDFDocument } from 'pdf-lib';

export interface CompressOptions {
  quality: number; // 0.1 to 1.0
  maxDimension?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  watermark?: boolean;
}

export async function compressImage(
  file: File,
  options: CompressOptions
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await loadImage(dataUrl);

  let { width, height } = img;
  const maxDim = options.maxDimension || 4000;

  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // If compressing to JPEG, fill with white background so transparent PNGs don't become black
  const targetFormat = options.format || (file.type === 'image/png' ? 'image/png' : 'image/jpeg');
  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas blob generation failed'));
          return;
        }
        const outUrl = URL.createObjectURL(blob);
        resolve({
          blob,
          dataUrl: outUrl,
          width,
          height,
        });
      },
      targetFormat,
      options.quality
    );
  });
}

export type ConvertFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

export async function convertImage(
  file: File,
  targetFormat: ConvertFormat,
  quality = 0.92,
  watermark = false
): Promise<{ blob: Blob; dataUrl: string; filename: string }> {
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

  if (targetFormat === 'application/pdf') {
    // Convert image to single-page PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.create();

    let embeddedImage;
    if (file.type === 'image/png') {
      embeddedImage = await pdfDoc.embedPng(arrayBuffer);
    } else {
      // Convert to JPEG first if WebP or other
      const imgData = await compressImage(file, { quality: 0.95, format: 'image/jpeg', watermark });
      const jpgBuffer = await imgData.blob.arrayBuffer();
      embeddedImage = await pdfDoc.embedJpg(jpgBuffer);
    }

    const { width, height } = embeddedImage.scale(1.0);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    return {
      blob,
      dataUrl: URL.createObjectURL(blob),
      filename: `${baseName}.pdf`,
    };
  }

  let ext = 'jpg';
  if (targetFormat === 'image/png') ext = 'png';
  if (targetFormat === 'image/webp') ext = 'webp';

  const compressed = await compressImage(file, {
    quality,
    format: targetFormat,
    watermark,
  });

  return {
    blob: compressed.blob,
    dataUrl: compressed.dataUrl,
    filename: `${baseName}.${ext}`,
  };
}

export interface ResizeOptions {
  width: number;
  height: number;
  mode: 'preserve-aspect' | 'stretch' | 'fit-pad';
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
  watermark?: boolean;
}

export async function resizeImage(
  file: File,
  options: ResizeOptions
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const targetFormat = options.format || (file.type === 'image/png' ? 'image/png' : 'image/jpeg');

  if (targetFormat === 'image/jpeg' || options.mode === 'fit-pad') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, options.width, options.height);
  }

  if (options.mode === 'stretch') {
    ctx.drawImage(img, 0, 0, options.width, options.height);
  } else if (options.mode === 'preserve-aspect') {
    // Scale preserving aspect ratio within target dimensions
    const scale = Math.min(options.width / img.width, options.height / img.height);
    const nw = Math.round(img.width * scale);
    const nh = Math.round(img.height * scale);

    // Resize canvas itself to match real dimension
    canvas.width = nw;
    canvas.height = nh;
    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, nw, nh);
    }
    ctx.drawImage(img, 0, 0, nw, nh);
  } else {
    // fit-pad (center with margins)
    const scale = Math.min(options.width / img.width, options.height / img.height);
    const nw = Math.round(img.width * scale);
    const nh = Math.round(img.height * scale);
    const x = Math.round((options.width - nw) / 2);
    const y = Math.round((options.height - nh) / 2);
    ctx.drawImage(img, x, y, nw, nh);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Failed to generate resized blob'));
        resolve({
          blob,
          dataUrl: URL.createObjectURL(blob),
          width: canvas.width,
          height: canvas.height,
        });
      },
      targetFormat,
      options.quality || 0.92
    );
  });
}

export interface RemoveBgOptions {
  tolerance: number; // 5 to 80
  feather: number; // 0 to 10
  replaceMode: 'transparent' | 'color' | 'gradient';
  customColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  samplePoint?: { x: number; y: number }; // User clicked color sample
  watermark?: boolean;
}

export async function processBackgroundRemoval(
  file: File,
  options: RemoveBgOptions
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Determine target background color
  let targetR = 255;
  let targetG = 255;
  let targetB = 255;

  if (options.samplePoint) {
    const { x, y } = options.samplePoint;
    const clampedX = Math.max(0, Math.min(canvas.width - 1, Math.round(x)));
    const clampedY = Math.max(0, Math.min(canvas.height - 1, Math.round(y)));
    const idx = (clampedY * canvas.width + clampedX) * 4;
    targetR = data[idx];
    targetG = data[idx + 1];
    targetB = data[idx + 2];
  } else {
    // Auto-detect dominant border color from corners and perimeter
    const sampleIndices = [
      0, // top-left
      (canvas.width - 1) * 4, // top-right
      ((canvas.height - 1) * canvas.width) * 4, // bottom-left
      ((canvas.height - 1) * canvas.width + (canvas.width - 1)) * 4, // bottom-right
      Math.floor(canvas.width / 2) * 4, // top-center
      ((canvas.height - 1) * canvas.width + Math.floor(canvas.width / 2)) * 4, // bottom-center
    ];

    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    sampleIndices.forEach((idx) => {
      sumR += data[idx];
      sumG += data[idx + 1];
      sumB += data[idx + 2];
    });

    targetR = Math.round(sumR / sampleIndices.length);
    targetG = Math.round(sumG / sampleIndices.length);
    targetB = Math.round(sumB / sampleIndices.length);
  }

  const tol = Math.max(1, options.tolerance * 2.2);
  const feather = Math.max(1, options.feather * 1.5);

  // Calculate Euclidean color distance and apply smooth alpha mask
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dr = r - targetR;
    const dg = g - targetG;
    const db = b - targetB;
    const dist = Math.sqrt(dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114);

    if (dist < tol) {
      // In background range
      if (dist < tol - feather) {
        data[i + 3] = 0;
      } else {
        // Soft feather edge
        const factor = (dist - (tol - feather)) / feather;
        data[i + 3] = Math.round(Math.min(255, Math.max(0, factor * 255)));
      }
    }
  }

  // Put alpha mask back onto canvas
  ctx.putImageData(imgData, 0, 0);

  // If replacing background with color or gradient
  let finalCanvas = canvas;
  if (options.replaceMode !== 'transparent') {
    const compCanvas = document.createElement('canvas');
    compCanvas.width = canvas.width;
    compCanvas.height = canvas.height;
    const compCtx = compCanvas.getContext('2d');
    if (compCtx) {
      if (options.replaceMode === 'color' && options.customColor) {
        compCtx.fillStyle = options.customColor;
        compCtx.fillRect(0, 0, compCanvas.width, compCanvas.height);
      } else if (options.replaceMode === 'gradient') {
        const grad = compCtx.createLinearGradient(0, 0, compCanvas.width, compCanvas.height);
        grad.addColorStop(0, options.gradientFrom || '#7F46F7');
        grad.addColorStop(1, options.gradientTo || '#212D3B');
        compCtx.fillStyle = grad;
        compCtx.fillRect(0, 0, compCanvas.width, compCanvas.height);
      }
      compCtx.drawImage(canvas, 0, 0);
      finalCanvas = compCanvas;
    }
  }

  return new Promise((resolve, reject) => {
    finalCanvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Failed to create cutout image'));
        resolve({
          blob,
          dataUrl: URL.createObjectURL(blob),
          width: finalCanvas.width,
          height: finalCanvas.height,
        });
      },
      'image/png'
    );
  });
}
