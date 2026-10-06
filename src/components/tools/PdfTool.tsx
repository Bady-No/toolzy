import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Dropzone } from '../common/Dropzone';
import { ToolHeader } from '../common/ToolHeader';
import { mergePdfFiles, compressPdfFile, getPdfInfo, PdfFileInfo } from '../../utils/pdfProcessing';
import { formatBytes, downloadBlob } from '../../utils/fileUtils';
import { 
  FileText, 
  Layers, 
  Minimize2, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Download, 
  CheckCircle,
  FileCheck2
} from 'lucide-react';

export const PdfTool: React.FC = () => {
  const { t, showToast, canProcessFile, recordFileProcessed } = useApp();

  const [activeTab, setActiveTab] = useState<'merge' | 'compress'>('merge');

  // Merge state
  const [mergeFiles, setMergeFiles] = useState<PdfFileInfo[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedResult, setMergedResult] = useState<{ blob: Blob; pageCount: number; dataUrl: string } | null>(null);

  // Compress state
  const [compressTarget, setCompressTarget] = useState<File | null>(null);
  const [compressLevel, setCompressLevel] = useState<'light' | 'strong'>('light');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressResult, setCompressResult] = useState<{ blob: Blob; originalSize: number; compressedSize: number } | null>(null);

  // Handle files for merge
  const handleMergeFiles = async (files: File[]) => {
    try {
      const infoList: PdfFileInfo[] = [];
      for (const file of files) {
        const info = await getPdfInfo(file);
        infoList.push(info);
      }
      setMergeFiles((prev) => [...prev, ...infoList]);
      setMergedResult(null);
    } catch (err: any) {
      showToast('خطأ في قراءة ملف PDF', 'error', err?.message);
    }
  };

  const moveMergeItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= mergeFiles.length) return;

    const list = [...mergeFiles];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);
    setMergeFiles(list);
    setMergedResult(null);
  };

  const removeMergeItem = (id: string) => {
    setMergeFiles((prev) => prev.filter((i) => i.id !== id));
    setMergedResult(null);
  };

  const executeMerge = async () => {
    if (mergeFiles.length < 2) {
      showToast('يرجى إضافة ملفين PDF على الأقل للدمج', 'warning');
      return;
    }

    // Check quota for all files combined
    const totalSize = mergeFiles.reduce((acc, f) => acc + f.size, 0);
    const check = canProcessFile(totalSize);
    if (!check.allowed) {
      showToast(check.reason || 'حجم الملف كبير جداً', 'error');
      return;
    }

    setIsMerging(true);
    try {
      const res = await mergePdfFiles(mergeFiles.map((m) => m.file));
      setMergedResult(res);
      recordFileProcessed();
      showToast('تم دمج ملفات PDF بنجاح!', 'success');
    } catch (err: any) {
      showToast('فشل دمج ملفات PDF', 'error', err?.message);
    } finally {
      setIsMerging(false);
    }
  };

  // Handle file for compression
  const handleCompressFile = (files: File[]) => {
    if (files.length > 0) {
      setCompressTarget(files[0]);
      setCompressResult(null);
    }
  };

  const executeCompress = async () => {
    if (!compressTarget) return;

    const check = canProcessFile(compressTarget.size);
    if (!check.allowed) {
      showToast(check.reason || 'حجم الملف كبير جداً', 'error');
      return;
    }

    setIsCompressing(true);
    try {
      const res = await compressPdfFile(compressTarget, compressLevel);
      setCompressResult(res);
      recordFileProcessed();
      showToast('تم ضغط ملف PDF بنجاح!', 'success');
    } catch (err: any) {
      showToast('فشل ضغط المستند', 'error', err?.message);
    } finally {
      setIsCompressing(false);
    }
  };

  const totalMergePages = mergeFiles.reduce((acc, f) => acc + f.pageCount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <ToolHeader tool="pdf" />

      {/* Tabs Switcher */}
      <div className="flex justify-center">
        <div className="p-1 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center gap-1 text-sm font-bold">
          <button
            onClick={() => setActiveTab('merge')}
            className={`px-5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'merge'
                ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('tools.pdf.mergeTab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('compress')}
            className={`px-5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'compress'
                ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Minimize2 className="w-4 h-4" />
            <span>{t('tools.pdf.compressTab')}</span>
          </button>
        </div>
      </div>

      {/* MERGE TAB */}
      {activeTab === 'merge' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <Dropzone
            onFilesSelected={handleMergeFiles}
            accept="application/pdf"
            multiple={true}
            title="اختر أو اسحب ملفات PDF لدمجها"
            supportedFormatsText="PDF"
          />

          {mergeFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    ملفات PDF ({mergeFiles.length})
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold">
                    {t('tools.pdf.totalPages', { count: totalMergePages })}
                  </span>
                </div>

                <button
                  onClick={() => setMergeFiles([])}
                  className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                >
                  {t('actions.clearAll')}
                </button>
              </div>

              <div className="space-y-2">
                {mergeFiles.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {formatBytes(item.size)} • {item.pageCount} صفحة
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveMergeItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveMergeItem(idx, 'down')}
                        disabled={idx === mergeFiles.length - 1}
                        className="p-1 rounded text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeMergeItem(item.id)}
                        className="p-1 rounded text-gray-400 hover:text-rose-500"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('tools.pdf.dragToReorder')}
                </p>

                <button
                  onClick={executeMerge}
                  disabled={isMerging || mergeFiles.length < 2}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isMerging ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('actions.processing')}</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      <span>{t('tools.pdf.mergeButton')}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Merged Result download */}
              {mergedResult && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        تم دمج المستند بنجاح! ({mergedResult.pageCount} صفحة)
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        الحجم الإجمالي: {formatBytes(mergedResult.blob.size)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => downloadBlob(mergedResult.blob, 'merged-document.pdf')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('actions.download')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* COMPRESS TAB */}
      {activeTab === 'compress' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <Dropzone
            onFilesSelected={handleCompressFile}
            accept="application/pdf"
            multiple={false}
            title="اختر ملف PDF لتصغير حجمه"
            supportedFormatsText="PDF"
          />

          {compressTarget && (
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-rose-500" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      {compressTarget.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      الحجم الحالي: {formatBytes(compressTarget.size)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCompressTarget(null);
                    setCompressResult(null);
                  }}
                  className="text-xs text-gray-400 hover:text-rose-500"
                >
                  {t('actions.remove')}
                </button>
              </div>

              {/* Compression level options */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t('tools.pdf.compressionLevel')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCompressLevel('light')}
                    className={`p-3 rounded-xl border text-start text-xs font-bold transition-all cursor-pointer ${
                      compressLevel === 'light'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div>{t('tools.pdf.lightCompress')}</div>
                    <span className="text-[11px] font-normal text-gray-500">
                      ضغط قياسي آمن مع حفظ جميع العناصر
                    </span>
                  </button>

                  <button
                    onClick={() => setCompressLevel('strong')}
                    className={`p-3 rounded-xl border text-start text-xs font-bold transition-all cursor-pointer ${
                      compressLevel === 'strong'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div>{t('tools.pdf.strongCompress')}</div>
                    <span className="text-[11px] font-normal text-gray-500">
                      تنظيف عميق للملفات الزائدة وتيار الكائنات
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={executeCompress}
                  disabled={isCompressing}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCompressing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('actions.processing')}</span>
                    </>
                  ) : (
                    <>
                      <Minimize2 className="w-4 h-4" />
                      <span>{t('tools.pdf.compressButton')}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Compressed Output */}
              {compressResult && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <FileCheck2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        تم ضغط المستند بنجاح!
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        من {formatBytes(compressResult.originalSize)} إلى{' '}
                        <span className="font-bold text-emerald-600">
                          {formatBytes(compressResult.compressedSize)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      downloadBlob(compressResult.blob, `compressed-${compressTarget.name}`)
                    }
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('actions.download')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
