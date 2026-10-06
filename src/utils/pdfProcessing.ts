import { PDFDocument } from 'pdf-lib';
import { readFileAsArrayBuffer } from './fileUtils';

export interface PdfFileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
}

export async function getPdfInfo(file: File): Promise<PdfFileInfo> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();

  return {
    id: Math.random().toString(36).substring(2, 9),
    file,
    name: file.name,
    size: file.size,
    pageCount,
  };
}

export async function mergePdfFiles(
  pdfFiles: File[]
): Promise<{ blob: Blob; pageCount: number; dataUrl: string }> {
  if (pdfFiles.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge');
  }

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;

  for (const file of pdfFiles) {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
    totalPages += copiedPages.length;
  }

  // Save merged document with stream compression
  const mergedPdfBytes = await mergedPdf.save({ useObjectStreams: true });
  const blob = new Blob([mergedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  return {
    blob,
    pageCount: totalPages,
    dataUrl: URL.createObjectURL(blob),
  };
}

export async function compressPdfFile(
  file: File,
  level: 'light' | 'strong' = 'light'
): Promise<{ blob: Blob; originalSize: number; compressedSize: number; dataUrl: string }> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  // Create a brand new clean document to purge historical object revisions and dangling xobjects
  const cleanPdf = await PDFDocument.create();

  // Strip excessive metadata in strong compression mode
  if (level === 'strong') {
    cleanPdf.setTitle('');
    cleanPdf.setAuthor('');
    cleanPdf.setSubject('');
    cleanPdf.setKeywords([]);
    cleanPdf.setProducer('ToolBox Local Compressor');
    cleanPdf.setCreator('');
  }

  const copiedPages = await cleanPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
  copiedPages.forEach((page) => cleanPdf.addPage(page));

  const compressedBytes = await cleanPdf.save({
    useObjectStreams: true,
  });

  const blob = new Blob([compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const originalSize = file.size;
  const compressedSize = blob.size;

  return {
    blob,
    originalSize,
    compressedSize,
    dataUrl: URL.createObjectURL(blob),
  };
}
