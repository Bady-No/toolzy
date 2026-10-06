import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { loadImage } from './fileUtils';

export interface QrOptions {
  width?: number;
  margin?: number;
  fgColor?: string;
  bgColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  logoDataUrl?: string;
  logoSizePercent?: number; // 10 to 30
}

export async function generateQr(
  text: string,
  options: QrOptions = {}
): Promise<{ dataUrl: string; svg: string }> {
  const width = options.width || 800;
  const margin = options.margin !== undefined ? options.margin : 2;
  const fg = options.fgColor || '#000000';
  const bg = options.bgColor || '#ffffff';
  const errorCorrectionLevel = options.errorCorrectionLevel || (options.logoDataUrl ? 'H' : 'M');

  // 1. Generate base data URL
  const baseDataUrl = await QRCode.toDataURL(text, {
    width,
    margin,
    color: {
      dark: fg,
      light: bg,
    },
    errorCorrectionLevel,
  });

  // 2. Generate SVG string
  const svg = await QRCode.toString(text, {
    type: 'svg',
    margin,
    color: {
      dark: fg,
      light: bg,
    },
    errorCorrectionLevel,
  });

  // 3. If logo is requested, overlay logo onto canvas
  if (options.logoDataUrl) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = width;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const qrImg = await loadImage(baseDataUrl);
      ctx.drawImage(qrImg, 0, 0, width, width);

      try {
        const logoImg = await loadImage(options.logoDataUrl);
        const logoPercent = (options.logoSizePercent || 22) / 100;
        const logoSize = Math.round(width * logoPercent);
        const logoX = Math.round((width - logoSize) / 2);
        const logoY = Math.round((width - logoSize) / 2);

        // Draw rounded white background for logo
        const radius = 12;
        const bgPadding = 8;
        const bgX = logoX - bgPadding;
        const bgY = logoY - bgPadding;
        const bgSize = logoSize + bgPadding * 2;

        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(bgX, bgY, bgSize, bgSize, radius) : ctx.rect(bgX, bgY, bgSize, bgSize);
        ctx.fill();

        ctx.strokeStyle = fg + '20';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw logo centered
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

        const compositeUrl = canvas.toDataURL('image/png');
        return { dataUrl: compositeUrl, svg };
      } catch (e) {
        console.warn('Failed to embed logo into QR code:', e);
      }
    }
  }

  return { dataUrl: baseDataUrl, svg };
}

export async function readQrFromImage(
  file: File
): Promise<{ success: boolean; data?: string; location?: any; error?: string }> {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = await loadImage(dataUrl);

    // Limit maximum dimensions for fast processing
    let w = img.width;
    let h = img.height;
    const maxDim = 1600;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to create canvas context');

    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (code && code.data) {
      return {
        success: true,
        data: code.data,
        location: code.location,
      };
    }

    return {
      success: false,
      error: 'No QR code detected in this image',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to process QR image',
    };
  }
}

export function buildWifiQrString(ssid: string, pass: string, enc: 'WPA' | 'WEP' | 'nopass' = 'WPA'): string {
  return `WIFI:T:${enc};S:${ssid};P:${pass};;`;
}

export function buildVCardString(card: {
  name: string;
  org?: string;
  title?: string;
  phone?: string;
  email?: string;
  url?: string;
}): string {
  let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
  vcard += `FN:${card.name}\n`;
  if (card.org) vcard += `ORG:${card.org}\n`;
  if (card.title) vcard += `TITLE:${card.title}\n`;
  if (card.phone) vcard += `TEL:${card.phone}\n`;
  if (card.email) vcard += `EMAIL:${card.email}\n`;
  if (card.url) vcard += `URL:${card.url}\n`;
  vcard += 'END:VCARD';
  return vcard;
}
