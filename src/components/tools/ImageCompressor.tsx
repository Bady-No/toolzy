import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ToolHeader } from '../common/ToolHeader';
import { Dropzone } from '../common/Dropzone';
import { compressImage, CompressOptions } from '../../utils/imageProcessing';
import { formatBytes, calculateSavings, downloadBlob, createAndDownloadZip } from '../../utils/fileUtils';
import { 
  Download, 
  Trash2, 
  Sliders, 
  Sparkles, 
  Eye, 
  Archive, 
  ArrowRight, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface CompressedItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  compressedSize?: number;
  previewUrl: string;
  resultUrl?: string;
  resultBlob?: Blob;
  savingsPercent?: number;
  savedBytes?: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  error?: string;
}

export const ImageCompressor: React.FC = () => {
  const { t, showToast, canProcessFile, recordFileProcessed } = useApp();

  const [items, setItems] = useState<CompressedItem[]>([]);
  const [level, setLevel] = useState<'low' | 'medium' | 'high' | 'custom'>('medium');
  const [customQuality, setCustomQuality] = useState<number>(80);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [activePreview, setActivePreview] = useState<CompressedItem | null>(null);

  const getQualityValue = (): number => {
    switch (level) {
      case 'low': return 0.90; // Light compression (superb quality)
      case 'medium': return 0.75; // Balanced
      case 'high': return 0.55; // Strong compression
      case 'custom': return customQuality / 100;
    }
  };

  const handleFiles = (files: File[]) => {
    const newItems: CompressedItem[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      originalSize: file.size,
      previewUrl: URL.createObjectURL(file),
      status: 'idle',
    }));

    setItems((prev) => [...prev, ...newItems]);
    // Automatically trigger compression
    setTimeout(() => {
      compressItems(newItems);
    }, 100);
  };

  const compressSingle = async (item: CompressedItem): Promise<CompressedItem> => {
    const check = canProcessFile(item.file.size);
    if (!check.allowed) {
      return {
        ...item,
        status: 'error',
        error: check.reason,
      };
    }

    try {
      const quality = getQualityValue();
      const res = await compressImage(item.file, {
        quality,
      });

      const { percent, savedBytes } = calculateSavings(item.originalSize, res.blob.size);
      recordFileProcessed();

      return {
        ...item,
        status: 'done',
        compressedSize: res.blob.size,
        resultUrl: res.dataUrl,
        resultBlob: res.blob,
        savingsPercent: percent,
        savedBytes,
      };
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        error: err?.message || 'Compression failed',
      };
    }
  };

  const compressItems = async (targets: CompressedItem[]) => {
    setIsProcessingAll(true);
    const updated = [...items];

    for (const target of targets) {
      setItems((prev) =>
        prev.map((i) => (i.id === target.id ? { ...i, status: 'processing' } : i))
      );

      const result = await compressSingle(target);

      setItems((prev) =>
        prev.map((i) => (i.id === target.id ? result : i))
      );
    }
    setIsProcessingAll(false);
  };

  const handleRecompressAll = () => {
    if (items.length === 0) return;
    compressItems(items);
  };

  const handleDownloadAll = async () => {
    const doneItems = items.filter((i) => i.status === 'done' && i.resultBlob);
    if (doneItems.length === 0) return;

    if (doneItems.length === 1) {
      downloadBlob(doneItems[0].resultBlob!, `compressed-${doneItems[0].name}`);
      return;
    }

    await createAndDownloadZip(
      doneItems.map((i) => ({ blob: i.resultBlob!, name: `compressed-${i.name}` })),
      'compressed-images.zip'
    );
    showToast('تم تحميل الملفات كـ ZIP بنجاح', 'success');
  };

  const handleClear = () => {
    items.forEach((i) => {
      URL.revokeObjectURL(i.previewUrl);
      if (i.resultUrl) URL.revokeObjectURL(i.resultUrl);
    });
    setItems([]);
    setActivePreview(null);
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (activePreview?.id === id) setActivePreview(null);
  };

  const doneCount = items.filter((i) => i.status === 'done').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Tool Header */}
      <ToolHeader tool="compress" />

      {/* Compression Settings Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {t('tools.compress.qualityLevel')}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
            {(['low', 'medium', 'high', 'custom'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  level === l
                    ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t(`tools.compress.${l}`)}
              </button>
            ))}
          </div>
        </div>

        {level === 'custom' && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4">
            <input
              type="range"
              min="10"
              max="95"
              value={customQuality}
              onChange={(e) => setCustomQuality(Number(e.target.value))}
              className="flex-1 accent-indigo-600 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 w-24 text-end">
              {t('tools.compress.qualitySlider', { val: customQuality })}
            </span>
          </div>
        )}

        {items.length > 0 && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleRecompressAll}
              disabled={isProcessingAll}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 underline cursor-pointer"
            >
              {t('tools.compress.recompress')}
            </button>
          </div>
        )}
      </div>

      {/* Upload Dropzone */}
      <div className="max-w-4xl mx-auto">
        <Dropzone
          onFilesSelected={handleFiles}
          accept="image/jpeg,image/png,image/webp"
          supportedFormatsText="JPG, PNG, WebP"
        />
      </div>

      {/* Items list & Actions */}
      {items.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {t('actions.filesCount', { count: items.length })}
            </span>
            <div className="flex items-center gap-2">
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

          {/* Cards */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 shrink-0 relative">
                    <img
                      src={item.resultUrl || item.previewUrl}
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
                      {item.compressedSize && (
                        <>
                          <ArrowRight className="w-3 h-3 text-indigo-500" />
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatBytes(item.compressedSize)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Savings Badge & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 dark:border-gray-800">
                  {item.status === 'processing' && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                      <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>{t('actions.processing')}</span>
                    </div>
                  )}

                  {item.status === 'done' && (
                    <>
                      <div className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        -{item.savingsPercent || 0}%
                      </div>

                      <button
                        onClick={() => setActivePreview(item)}
                        className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title={t('tools.compress.beforeAfterPreview')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => downloadBlob(item.resultBlob!, `compressed-${item.name}`)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 cursor-pointer shadow-sm shadow-indigo-600/20"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('actions.download')}</span>
                      </button>
                    </>
                  )}

                  {item.status === 'error' && (
                    <div className="flex items-center gap-1 text-xs text-rose-500 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[150px]">{item.error}</span>
                    </div>
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

      {/* Comparison Modal */}
      {activePreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setActivePreview(null)}
        >
          <div 
            className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {t('tools.compress.beforeAfterPreview')}: {activePreview.name}
              </h3>
              <button
                onClick={() => setActivePreview(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>{t('tools.compress.original')}</span>
                  <span>{formatBytes(activePreview.originalSize)}</span>
                </div>
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <img
                    src={activePreview.previewUrl}
                    alt="Original"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>{t('tools.compress.compressed')} (-{activePreview.savingsPercent}%)</span>
                  <span>{activePreview.compressedSize ? formatBytes(activePreview.compressedSize) : ''}</span>
                </div>
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-emerald-500/40 flex items-center justify-center">
                  <img
                    src={activePreview.resultUrl || activePreview.previewUrl}
                    alt="Compressed"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              {activePreview.resultBlob && (
                <button
                  onClick={() => downloadBlob(activePreview.resultBlob!, `compressed-${activePreview.name}`)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('actions.download')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
