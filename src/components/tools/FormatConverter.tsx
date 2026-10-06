import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Dropzone } from '../common/Dropzone';
import { ToolHeader } from '../common/ToolHeader';
import { convertImage, ConvertFormat } from '../../utils/imageProcessing';
import { formatBytes, downloadBlob, createAndDownloadZip } from '../../utils/fileUtils';
import { 
  RefreshCw, 
  Download, 
  Trash2, 
  Archive, 
  ArrowRight, 
  FileCheck,
  FileType
} from 'lucide-react';

interface ConvertItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  previewUrl: string;
  targetFormat: ConvertFormat;
  status: 'idle' | 'processing' | 'done' | 'error';
  resultUrl?: string;
  resultBlob?: Blob;
  resultFilename?: string;
  error?: string;
}

export const FormatConverter: React.FC = () => {
  const { t, showToast, canProcessFile, recordFileProcessed } = useApp();

  const [items, setItems] = useState<ConvertItem[]>([]);
  const [globalFormat, setGlobalFormat] = useState<ConvertFormat>('image/webp');
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const formatOptions: Array<{ value: ConvertFormat; label: string }> = [
    { value: 'image/png', label: 'PNG' },
    { value: 'image/jpeg', label: 'JPG' },
    { value: 'image/webp', label: 'WebP' },
    { value: 'application/pdf', label: 'PDF' },
  ];

  const handleFiles = (files: File[]) => {
    const newItems: ConvertItem[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      originalSize: file.size,
      previewUrl: URL.createObjectURL(file),
      targetFormat: globalFormat,
      status: 'idle',
    }));

    setItems((prev) => [...prev, ...newItems]);
    // Auto convert
    setTimeout(() => {
      convertItems(newItems);
    }, 100);
  };

  const handleGlobalFormatChange = (fmt: ConvertFormat) => {
    setGlobalFormat(fmt);
    setItems((prev) =>
      prev.map((i) => ({
        ...i,
        targetFormat: fmt,
        status: 'idle',
      }))
    );
  };

  const convertSingle = async (item: ConvertItem): Promise<ConvertItem> => {
    const check = canProcessFile(item.file.size);
    if (!check.allowed) {
      return {
        ...item,
        status: 'error',
        error: check.reason,
      };
    }

    try {
      const res = await convertImage(item.file, item.targetFormat, 0.92, false);
      recordFileProcessed();

      return {
        ...item,
        status: 'done',
        resultUrl: res.dataUrl,
        resultBlob: res.blob,
        resultFilename: res.filename,
      };
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        error: err?.message || 'Conversion failed',
      };
    }
  };

  const convertItems = async (targets: ConvertItem[]) => {
    setIsProcessingAll(true);

    for (const target of targets) {
      setItems((prev) =>
        prev.map((i) => (i.id === target.id ? { ...i, status: 'processing' } : i))
      );

      const result = await convertSingle(target);

      setItems((prev) =>
        prev.map((i) => (i.id === target.id ? result : i))
      );
    }
    setIsProcessingAll(false);
  };

  const handleConvertAll = () => {
    if (items.length === 0) return;
    convertItems(items);
  };

  const handleDownloadAll = async () => {
    const doneItems = items.filter((i) => i.status === 'done' && i.resultBlob);
    if (doneItems.length === 0) return;

    if (doneItems.length === 1) {
      downloadBlob(doneItems[0].resultBlob!, doneItems[0].resultFilename!);
      return;
    }

    await createAndDownloadZip(
      doneItems.map((i) => ({ blob: i.resultBlob!, name: i.resultFilename! })),
      'converted-files.zip'
    );
    showToast('تم تحميل كل الملفات كـ ZIP بنجاح', 'success');
  };

  const handleClear = () => {
    items.forEach((i) => {
      URL.revokeObjectURL(i.previewUrl);
      if (i.resultUrl) URL.revokeObjectURL(i.resultUrl);
    });
    setItems([]);
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const doneCount = items.filter((i) => i.status === 'done').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <ToolHeader tool="convert" />

      {/* Target Format Selector */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileType className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {t('tools.convert.convertTo')}:
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 w-full sm:w-auto">
          {formatOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleGlobalFormatChange(opt.value)}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                globalFormat === opt.value
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dropzone */}
      <div className="max-w-4xl mx-auto">
        <Dropzone
          onFilesSelected={handleFiles}
          accept="image/*"
          supportedFormatsText="PNG, JPG, WebP, SVG, GIF, BMP"
        />
      </div>

      {/* Files List */}
      {items.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {t('actions.filesCount', { count: items.length })}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleConvertAll}
                disabled={isProcessingAll}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessingAll ? 'animate-spin' : ''}`} />
                <span>{t('tools.convert.batchAction')}</span>
              </button>

              {doneCount > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{t('tools.convert.downloadZip')}</span>
                </button>
              )}

              <button
                onClick={handleClear}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('actions.clearAll')}</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 shrink-0 relative flex items-center justify-center">
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate max-w-xs sm:max-w-sm">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <span>{formatBytes(item.originalSize)}</span>
                      <ArrowRight className="w-3 h-3 text-indigo-500" />
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                        {item.targetFormat.replace('image/', '').replace('application/', '')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 dark:border-gray-800">
                  {item.status === 'processing' && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                      <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>{t('actions.processing')}</span>
                    </div>
                  )}

                  {item.status === 'done' && item.resultBlob && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>{formatBytes(item.resultBlob.size)}</span>
                      </span>

                      <button
                        onClick={() => downloadBlob(item.resultBlob!, item.resultFilename!)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 cursor-pointer shadow-sm shadow-indigo-600/20"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('actions.download')}</span>
                      </button>
                    </div>
                  )}

                  {item.status === 'error' && (
                    <span className="text-xs text-rose-500 font-medium truncate max-w-[150px]">
                      {item.error}
                    </span>
                  )}

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
