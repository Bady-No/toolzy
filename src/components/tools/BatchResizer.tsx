import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Dropzone } from '../common/Dropzone';
import { ToolHeader } from '../common/ToolHeader';
import { resizeImage, ResizeOptions } from '../../utils/imageProcessing';
import { formatBytes, downloadBlob, createAndDownloadZip } from '../../utils/fileUtils';
import { 
  Scaling, 
  Download, 
  Trash2, 
  Archive, 
  ArrowRight, 
  Check, 
  Maximize,
  Sliders
} from 'lucide-react';

interface ResizeItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  previewUrl: string;
  originalDims?: { width: number; height: number };
  newDims?: { width: number; height: number };
  resultUrl?: string;
  resultBlob?: Blob;
  status: 'idle' | 'processing' | 'done' | 'error';
  error?: string;
}

export const BatchResizer: React.FC = () => {
  const { t, showToast, canProcessFile, recordFileProcessed } = useApp();

  const [items, setItems] = useState<ResizeItem[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('insta-square');
  const [targetWidth, setTargetWidth] = useState<number>(1080);
  const [targetHeight, setTargetHeight] = useState<number>(1080);
  const [mode, setMode] = useState<'preserve-aspect' | 'stretch' | 'fit-pad'>('preserve-aspect');
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const presets = [
    { id: 'insta-square', label: t('tools.resize.presetInstaSquare'), w: 1080, h: 1080 },
    { id: 'insta-story', label: t('tools.resize.presetInstaStory'), w: 1080, h: 1920 },
    { id: 'twitter-post', label: t('tools.resize.presetTwitterPost'), w: 1200, h: 675 },
    { id: 'fb-cover', label: t('tools.resize.presetFacebookCover'), w: 820, h: 312 },
    { id: 'ecom-product', label: t('tools.resize.presetEcomProduct'), w: 800, h: 800 },
    { id: 'custom', label: t('tools.resize.customSize'), w: targetWidth, h: targetHeight },
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setSelectedPreset(p.id);
    if (p.id !== 'custom') {
      setTargetWidth(p.w);
      setTargetHeight(p.h);
    }
  };

  const handleFiles = (files: File[]) => {
    const newItems: ResizeItem[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      originalSize: file.size,
      previewUrl: URL.createObjectURL(file),
      status: 'idle',
    }));

    setItems((prev) => [...prev, ...newItems]);
    setTimeout(() => {
      resizeItems(newItems);
    }, 100);
  };

  const resizeSingle = async (item: ResizeItem): Promise<ResizeItem> => {
    const check = canProcessFile(item.file.size);
    if (!check.allowed) {
      return {
        ...item,
        status: 'error',
        error: check.reason,
      };
    }

    try {
      const res = await resizeImage(item.file, {
        width: targetWidth,
        height: targetHeight,
        mode,
      });

      recordFileProcessed();

      return {
        ...item,
        status: 'done',
        resultUrl: res.dataUrl,
        resultBlob: res.blob,
        newDims: { width: res.width, height: res.height },
      };
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        error: err?.message || 'Resize failed',
      };
    }
  };

  const resizeItems = async (targets: ResizeItem[]) => {
    setIsProcessingAll(true);

    for (const target of targets) {
      setItems((prev) =>
        prev.map((i) => (i.id === target.id ? { ...i, status: 'processing' } : i))
      );

      const result = await resizeSingle(target);

      setItems((prev) =>
        prev.map((i) => (i.id === target.id ? result : i))
      );
    }
    setIsProcessingAll(false);
  };

  const handleResizeAll = () => {
    if (items.length === 0) return;
    resizeItems(items);
  };

  const handleDownloadAll = async () => {
    const doneItems = items.filter((i) => i.status === 'done' && i.resultBlob);
    if (doneItems.length === 0) return;

    if (doneItems.length === 1) {
      downloadBlob(doneItems[0].resultBlob!, `resized-${doneItems[0].name}`);
      return;
    }

    await createAndDownloadZip(
      doneItems.map((i) => ({ blob: i.resultBlob!, name: `resized-${i.name}` })),
      'resized-images.zip'
    );
    showToast('تم تحميل كل الصور كـ ZIP', 'success');
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
      <ToolHeader tool="resize" />

      {/* Preset & Size Controls */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm max-w-4xl mx-auto space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
            {t('tools.resize.presets')}:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`p-2.5 rounded-xl border text-start text-xs font-semibold transition-all cursor-pointer ${
                  selectedPreset === p.id
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Dimensions Inputs */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              {t('tools.resize.width')}
            </label>
            <input
              type="number"
              min="10"
              max="10000"
              value={targetWidth}
              onChange={(e) => {
                setTargetWidth(Number(e.target.value));
                setSelectedPreset('custom');
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              {t('tools.resize.height')}
            </label>
            <input
              type="number"
              min="10"
              max="10000"
              value={targetHeight}
              onChange={(e) => {
                setTargetHeight(Number(e.target.value));
                setSelectedPreset('custom');
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              {t('tools.resize.resizeMode')}
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="preserve-aspect">{t('tools.resize.keepAspect')}</option>
              <option value="stretch">{t('tools.resize.stretch')}</option>
              <option value="fit-pad">{t('tools.resize.modeFitPad')}</option>
            </select>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleResizeAll}
              disabled={isProcessingAll}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              {t('tools.resize.applyAll')}
            </button>
          </div>
        )}
      </div>

      {/* Dropzone */}
      <div className="max-w-4xl mx-auto">
        <Dropzone
          onFilesSelected={handleFiles}
          accept="image/*"
          supportedFormatsText="JPG, PNG, WebP"
        />
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {t('actions.selectedImages', { count: items.length })}
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

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 shrink-0 relative flex items-center justify-center">
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
                      {item.newDims && (
                        <>
                          <ArrowRight className="w-3 h-3 text-indigo-500" />
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                            {item.newDims.width} × {item.newDims.height} px
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 dark:border-gray-800">
                  {item.status === 'processing' && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                      <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>{t('actions.processing')}</span>
                    </div>
                  )}

                  {item.status === 'done' && item.resultBlob && (
                    <button
                      onClick={() => downloadBlob(item.resultBlob!, `resized-${item.name}`)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 cursor-pointer shadow-sm shadow-indigo-600/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('actions.download')}</span>
                    </button>
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
