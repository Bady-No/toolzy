import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ToolHeader } from '../common/ToolHeader';
import { Dropzone } from '../common/Dropzone';
import { readQrFromImage } from '../../utils/qrUtils';
import { 
  ScanLine, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const QrReader: React.FC = () => {
  const { t, showToast } = useApp();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setExtractedData(null);
    setErrorMsg(null);
    setIsScanning(true);

    try {
      const res = await readQrFromImage(file);
      if (res.success && res.data) {
        setExtractedData(res.data);
        showToast(t('tools.qrRead.successFound'), 'success');
      } else {
        setErrorMsg(t('tools.qrRead.noQrFound'));
        showToast('لم يتم العثور على رمز QR', 'warning', 'تأكد من وضوح الصورة وزاوية التصوير');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'فشلت معالجة الصورة');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopy = () => {
    if (!extractedData) return;
    navigator.clipboard.writeText(extractedData);
    setCopied(true);
    showToast(t('tools.qrRead.copied'), 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const isUrl = extractedData && (extractedData.startsWith('http://') || extractedData.startsWith('https://'));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <ToolHeader tool="qr-read" />

      <div className="max-w-3xl mx-auto space-y-6">
        <Dropzone
          onFilesSelected={handleFile}
          accept="image/*"
          multiple={false}
          title={t('tools.qrRead.scanPrompt')}
          supportedFormatsText="PNG, JPG, WebP, Screenshot"
        />

        {/* Scanning status */}
        {isScanning && (
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
              جارٍ قراءة وفحص كود الـ QR بدقة...
            </p>
          </div>
        )}

        {/* Error notice */}
        {errorMsg && !isScanning && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 font-medium">
              {errorMsg}
            </p>
          </div>
        )}

        {/* Extracted Result */}
        {extractedData && !isScanning && (
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {t('tools.qrRead.extractedContent')}
                </h3>
              </div>

              {isUrl && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  رابط ويب مباشر
                </span>
              )}
            </div>

            {/* Content view box */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 font-mono text-sm text-gray-800 dark:text-gray-100 break-all select-all leading-relaxed max-h-60 overflow-y-auto">
              {extractedData}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t('tools.qrRead.copied') : t('tools.qrRead.copyContent')}</span>
              </button>

              {isUrl && (
                <a
                  href={extractedData}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-transform hover:scale-[1.02]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{t('tools.qrRead.openLink')}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Image Preview with thumbnail if loaded */}
        {previewUrl && (
          <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Uploaded QR"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              تم فحص الصورة محلياً بنجاح في متصفحك دون رفعها إلى أي مكان.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
