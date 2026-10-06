import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTool } from '../../constants/tools';
import { copyText } from '../../utils/clipboard';

interface ShareButtonProps {
  /** Tool to share — its hash deep link (`#tool-id`) is what gets copied/sent */
  toolId: string;
  /**
   * Classes for the positioning wrapper. Defaults to `relative`;
   * pass `absolute …` classes to pin the button somewhere (e.g. card corner).
   */
  wrapperClassName?: string;
}

const menuItem =
  'w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-start';

/**
 * Compact share button for tool cards. Opens a menu with copy-link,
 * the native share sheet (when available) and WhatsApp / X / Telegram.
 * Deep links land directly on the tool thanks to the hash routing in AppContext.
 */
export const ShareButton: React.FC<ShareButtonProps> = ({ toolId, wrapperClassName }) => {
  const { t, showToast } = useApp();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const meta = getTool(toolId);
  const title = meta ? t(meta.titleKey) : 'Toolzy';
  const url = `${window.location.origin}${window.location.pathname}#${toolId}`;
  const message = `${title} — Toolzy ${url}`;

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setCopied(false);
  };

  const copyLink = async () => {
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      showToast(t('share.copied'), 'success');
      window.setTimeout(close, 1100);
    } else {
      showToast(t('share.copyFailed'), 'error');
      close();
    }
  };

  const nativeShare = async () => {
    close();
    try {
      await navigator.share({ title: `Toolzy — ${title}`, text: message, url });
    } catch {
      /* user dismissed the sheet */
    }
  };

  const encUrl = encodeURIComponent(url);
  const encMsg = encodeURIComponent(message);
  const socials = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${encMsg}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${encUrl}&text=${encMsg}` },
    { label: 'Telegram', href: `https://t.me/share/url?url=${encUrl}&text=${encMsg}` },
  ];

  const wrapper = wrapperClassName ?? 'relative';

  return (
    <div ref={wrapRef} className={wrapper}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t('share.label')}: ${title}`}
        title={t('share.label')}
        className="h-8 w-8 grid place-items-center rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer focus-visible:outline-2"
      >
        <Share2 className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('share.label')}
          className="absolute top-full start-1/2 -translate-x-1/2 mt-2 w-52 p-1.5 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-pop border border-gray-200/80 dark:border-gray-800 z-50 animate-in fade-in zoom-in-95"
        >
          <button type="button" role="menuitem" onClick={copyLink} className={menuItem}>
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
            <span>{copied ? t('share.copied') : t('share.copy')}</span>
          </button>

          {canNativeShare && (
            <button type="button" role="menuitem" onClick={nativeShare} className={menuItem}>
              <Share2 className="w-4 h-4 text-gray-400" />
              <span>{t('share.native')}</span>
            </button>
          )}

          <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" aria-hidden="true" />

          {socials.map((s) => (
            <a
              key={s.label}
              role="menuitem"
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className={menuItem}
            >
              <span>{s.label}</span>
              <span aria-hidden="true" className="text-xs text-gray-300 dark:text-gray-600">
                ↗
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
