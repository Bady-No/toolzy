import React, { useState, useRef, useEffect, DragEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { UploadCloud, Image, FileText, Plus, Clipboard } from 'lucide-react';
import { formatBytes } from '../../utils/fileUtils';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string; // e.g. "image/jpeg,image/png,image/webp" or "application/pdf"
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  supportedFormatsText?: string;
  disabled?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesSelected,
  accept = 'image/*',
  multiple = true,
  title,
  subtitle,
  supportedFormatsText,
  disabled = false,
}) => {
  const { t, showToast } = useApp();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeMB = 100;

  const handleFiles = (fileList: FileList | null | File[]) => {
    if (!fileList || fileList.length === 0 || disabled) return;

    const filesArray = Array.from(fileList);
    const validFiles: File[] = [];

    for (const file of filesArray) {
      // Check type if specific
      if (accept && accept !== '*/*') {
        const acceptList = accept.split(',').map((s) => s.trim().toLowerCase());
        const match = acceptList.some((pat) => {
          if (pat.endsWith('/*')) {
            const prefix = pat.replace('/*', '');
            return file.type.startsWith(prefix);
          }
          if (pat.startsWith('.')) {
            return file.name.toLowerCase().endsWith(pat);
          }
          return file.type.toLowerCase() === pat;
        });

        if (!match) {
          showToast(
            t('dropzone.unsupportedFile', { name: file.name }),
            'error',
            supportedFormatsText || t('dropzone.chooseFormat')
          );
          continue;
        }
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      if (!multiple && validFiles.length > 1) {
        onFilesSelected([validFiles[0]]);
      } else {
        onFilesSelected(validFiles);
      }
    }
  };

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        handleFiles(e.clipboardData.files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [disabled, accept, multiple]);

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const isPdf = accept.includes('pdf');

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={title || t('dropzone.dragTitle')}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative group cursor-pointer rounded-3xl border-2 border-dashed p-8 md:p-12 text-center transition-all duration-300 select-none overflow-hidden ${
        disabled
          ? 'opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-800'
          : isDragOver
          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-pop scale-[1.01]'
          : 'border-gray-300 dark:border-gray-700/80 bg-white/70 dark:bg-gray-900/50 shadow-card hover:border-indigo-400 hover:bg-white dark:hover:bg-gray-900 hover:shadow-raised'
      }`}
    >
      {/* Soft brand glow */}
      <div
        className={`absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-48 rounded-full blur-3xl transition-opacity duration-300 pointer-events-none ${
          isDragOver ? 'bg-indigo-500/30 opacity-100' : 'bg-indigo-500/10 opacity-60'
        }`}
        aria-hidden="true"
      />

      {/* Diagonal light sweep while files are being dragged over */}
      {isDragOver && <span className="dropzone-sweep" aria-hidden="true" />}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center justify-center space-y-4">
        {/* Animated icon container */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isDragOver
              ? 'bg-gradient-to-br from-ink-800 to-indigo-500 text-white shadow-glow scale-110'
              : 'bg-gradient-to-br from-indigo-50 to-indigo-100/70 dark:from-indigo-950/70 dark:to-indigo-900/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 group-hover:-rotate-3'
          }`}
        >
          {isPdf ? (
            <FileText className="w-8 h-8" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            {title || t('dropzone.dragTitle')}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {subtitle || t('dropzone.dragSubtitle')}
          </p>
        </div>

        {/* Badges / Hints */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {supportedFormatsText && (
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-200/60 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {supportedFormatsText}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
            {t('dropzone.maxSizeLabel', { size: `${maxSizeMB} MB` })}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700">
            <Clipboard className="w-3 h-3 text-indigo-500" />
            <span>{t('dropzone.pasteHint')}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
