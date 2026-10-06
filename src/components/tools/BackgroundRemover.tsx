import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Dropzone } from '../common/Dropzone';
import { ToolHeader } from '../common/ToolHeader';
import { processBackgroundRemoval, RemoveBgOptions } from '../../utils/imageProcessing';
import { formatBytes, downloadBlob } from '../../utils/fileUtils';
import { 
  Sparkles, 
  Download, 
  Pipette, 
  Sliders, 
  RefreshCw, 
  Layers, 
  Check, 
  Palette,
  Image as ImageIcon
} from 'lucide-react';

export const BackgroundRemover: React.FC = () => {
  const { t, showToast, canProcessFile, recordFileProcessed } = useApp();

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Settings
  const [tolerance, setTolerance] = useState(25);
  const [feather, setFeather] = useState(3);
  const [replaceMode, setReplaceMode] = useState<'transparent' | 'color' | 'gradient'>('transparent');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [samplePoint, setSamplePoint] = useState<{ x: number; y: number } | undefined>(undefined);
  const [isEyeDropperActive, setIsEyeDropperActive] = useState(false);

  const originalImgRef = useRef<HTMLImageElement>(null);

  const handleFile = (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setOriginalUrl(url);
    setResultUrl(null);
    setResultBlob(null);
    setSamplePoint(undefined);

    // Auto process with defaults
    setTimeout(() => {
      runRemoval(selected, {
        tolerance: 25,
        feather: 3,
        replaceMode: 'transparent',
      });
    }, 150);
  };

  const runRemoval = async (targetFile = file, customOpts?: Partial<RemoveBgOptions>) => {
    if (!targetFile) return;

    const check = canProcessFile(targetFile.size, true);
    if (!check.allowed) {
      showToast(check.reason || 'حجم الملف كبير جداً', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const opts: RemoveBgOptions = {
        tolerance,
        feather,
        replaceMode,
        customColor: selectedColor,
        samplePoint,
        ...customOpts,
      };

      const res = await processBackgroundRemoval(targetFile, opts);
      setResultUrl(res.dataUrl);
      setResultBlob(res.blob);
      recordFileProcessed(true);
      showToast('تمت إزالة الخلفية بنجاح!', 'success');
    } catch (err: any) {
      showToast('حدث خطأ أثناء معالجة الصورة', 'error', err?.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyeDropperActive || !originalImgRef.current) return;

    const rect = originalImgRef.current.getBoundingClientRect();
    const naturalWidth = originalImgRef.current.naturalWidth;
    const naturalHeight = originalImgRef.current.naturalHeight;

    const scaleX = naturalWidth / rect.width;
    const scaleY = naturalHeight / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    setSamplePoint({ x: clickX, y: clickY });
    setIsEyeDropperActive(false);

    showToast('تم التقاط اللون المستهدف!', 'info', 'جارٍ إعادة التحديد...');
    runRemoval(file!, { samplePoint: { x: clickX, y: clickY } });
  };

  const popularColors = ['#ffffff', '#000000', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <ToolHeader tool="remove-bg" />

      {!originalUrl ? (
        <div className="max-w-4xl mx-auto">
          <Dropzone
            onFilesSelected={handleFile}
            accept="image/jpeg,image/png,image/webp"
            multiple={false}
            title="ارفع صورة لعزل الخلفية منها في ثوانٍ"
            supportedFormatsText="JPG, PNG, WebP"
          />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  خيارات العزل والتحكم
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEyeDropperActive(!isEyeDropperActive)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isEyeDropperActive
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm animate-pulse'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  title="انقر على الصورة لتحديد لون الخلفية المراد عزله"
                >
                  <Pipette className="w-3.5 h-3.5" />
                  <span>{isEyeDropperActive ? 'انقر على الخلفية الآن' : 'أداة القطارة (اختر لون)'}</span>
                </button>

                <button
                  onClick={() => {
                    setOriginalUrl(null);
                    setFile(null);
                    setResultUrl(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                >
                  صورة أخرى
                </button>
              </div>
            </div>

            {/* Sliders: Tolerance & Feather */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
                  <span>{t('tools.removeBg.brushTolerance')}</span>
                  <span className="font-bold text-indigo-600">{tolerance}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  onMouseUp={() => runRemoval()}
                  onTouchEnd={() => runRemoval()}
                  className="w-full accent-indigo-600 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
                  <span>{t('tools.removeBg.edgeFeather')}</span>
                  <span className="font-bold text-indigo-600">{feather}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={feather}
                  onChange={(e) => setFeather(Number(e.target.value))}
                  onMouseUp={() => runRemoval()}
                  onTouchEnd={() => runRemoval()}
                  className="w-full accent-indigo-600 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Background replacement options */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                استبدال الخلفية:
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setReplaceMode('transparent');
                    runRemoval(file!, { replaceMode: 'transparent' });
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    replaceMode === 'transparent'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {t('tools.removeBg.transparentBg')}
                </button>

                <button
                  onClick={() => {
                    setReplaceMode('color');
                    runRemoval(file!, { replaceMode: 'color', customColor: selectedColor });
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    replaceMode === 'color'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {t('tools.removeBg.colorBg')}
                </button>

                <button
                  onClick={() => {
                    setReplaceMode('gradient');
                    runRemoval(file!, {
                      replaceMode: 'gradient',
                      gradientFrom: '#7F46F7',
                      gradientTo: '#212D3B',
                    });
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    replaceMode === 'gradient'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {t('tools.removeBg.gradientBg')}
                </button>

                {replaceMode === 'color' && (
                  <div className="flex items-center gap-2 ps-2 border-s border-gray-200 dark:border-gray-700">
                    {popularColors.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setSelectedColor(c);
                          runRemoval(file!, { replaceMode: 'color', customColor: c });
                        }}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border border-gray-300 shadow-xs cursor-pointer ${
                          selectedColor === c ? 'ring-2 ring-indigo-500 scale-110' : ''
                        }`}
                      />
                    ))}
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => {
                        setSelectedColor(e.target.value);
                        runRemoval(file!, { replaceMode: 'color', customColor: e.target.value });
                      }}
                      className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer overflow-hidden"
                      title="لون مخصص"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Previews (Side-by-Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original with Eyedropper target */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-400">
                <span>{t('tools.removeBg.originalView')}</span>
                {isEyeDropperActive && (
                  <span className="text-amber-500 animate-pulse font-bold">
                    انقر فوق أي مكان في الخلفية لإزالته
                  </span>
                )}
              </div>

              <div
                className={`relative aspect-square rounded-2xl overflow-hidden border-2 bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${
                  isEyeDropperActive
                    ? 'cursor-crosshair border-amber-500 shadow-md ring-2 ring-amber-400/50'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <img
                  ref={originalImgRef}
                  src={originalUrl}
                  alt="Original"
                  onClick={handleImageClick}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            {/* Cutout Result */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-400">
                <span>{t('tools.removeBg.resultView')}</span>
                {isProcessing && (
                  <span className="text-indigo-600 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>جارٍ المعالجة...</span>
                  </span>
                )}
              </div>

              <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-900/60 bg-transparency-pattern flex items-center justify-center">
                {resultUrl ? (
                  <img
                    src={resultUrl}
                    alt="Result Cutout"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-xs mt-2 font-medium">جارٍ تفريغ الصورة...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Download Bar */}
          {resultBlob && (
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                الحجم: <span className="font-bold text-gray-900 dark:text-white">{formatBytes(resultBlob.size)}</span> • صيغة PNG بدقة عالية
              </div>

              <button
                onClick={() => downloadBlob(resultBlob, `cutout-${file?.name || 'image'}.png`)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                <span>{t('actions.download')} (PNG)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
