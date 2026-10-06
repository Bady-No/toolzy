import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  WifiOff,
  MessageCircle,
  Send,
  Copy,
  Check,
} from 'lucide-react';
import { getTool } from '../../constants/tools';
import { copyText } from '../../utils/clipboard';

interface ToolHeaderProps {
  tool: string;
}

/**
 * Consistent, professional header shared by every tool screen:
 * back affordance, identity tile, title, description, trust chips
 * and a one-tap share row (WhatsApp first) — shared links deep-link
 * straight back to this tool via the hash route.
 */
export const ToolHeader: React.FC<ToolHeaderProps> = ({ tool }) => {
  const { lang, setActiveTool, t, showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const meta = getTool(tool);

  if (!meta) return null;

  const Icon = meta.icon;
  const BackArrow = lang === 'ar' ? ArrowRight : ArrowLeft;

  // Direct sharing: WhatsApp/Telegram/X open pre-filled, ready to send to a friend
  const shareUrl = `${window.location.origin}${window.location.pathname}#${tool}`;
  const shareTitle = t(meta.titleKey);
  const encUrl = encodeURIComponent(shareUrl);
  const encTitle = encodeURIComponent(shareTitle);
  const encMessage = encodeURIComponent(`${shareTitle} — Toolzy ${shareUrl}`);

  const handleCopy = async () => {
    const ok = await copyText(shareUrl);
    if (ok) {
      setCopied(true);
      showToast(t('share.copied'), 'success');
      window.setTimeout(() => setCopied(false), 1600);
    } else {
      showToast(t('share.copyFailed'), 'error');
    }
  };

  const ghostPill =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-white dark:bg-gray-900 transition-colors cursor-pointer focus-visible:outline-2';

  return (
    <header className="max-w-3xl mx-auto text-center space-y-5 animate-in fade-in-up">
      <button
        type="button"
        onClick={() => setActiveTool('home')}
        className="btn btn-ghost -mt-1 mx-auto text-xs font-bold"
      >
        <BackArrow className="w-3.5 h-3.5" />
        <span>{t('nav.backToTools')}</span>
      </button>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:text-start text-center">
        <div className="relative shrink-0">
          {/* Soft aura behind the identity tile */}
          <div
            aria-hidden="true"
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${meta.gradient} blur-xl opacity-45`}
          />
          <div
            className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white shadow-lg shadow-slate-900/10`}
          >
            <Icon className="w-7 h-7" />
          </div>
        </div>

        <div className="space-y-1.5 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {t(meta.titleKey)}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {t(meta.longDescKey)}
          </p>
        </div>
      </div>

      <div className="stagger flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t('app.badge')}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60">
          <Zap className="w-3.5 h-3.5" />
          {meta.badge}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
          <WifiOff className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'بدون إنترنت' : lang === 'fr' ? 'Hors ligne' : 'Works offline'}
        </span>
      </div>

      {/* One-tap share row — WhatsApp front and center */}
      <div className="stagger flex flex-wrap items-center justify-center gap-2">
        <a
          href={`https://wa.me/?text=${encMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          title={lang === 'ar' ? 'مشاركة عبر واتساب' : lang === 'fr' ? 'Partager sur WhatsApp' : 'Share on WhatsApp'}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer focus-visible:outline-2"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </a>

        <a
          href={`https://t.me/share/url?url=${encUrl}&text=${encTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Telegram"
          className={`${ghostPill} border-sky-200 dark:border-sky-800/70 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/60`}
        >
          <Send className="w-3.5 h-3.5" />
          Telegram
        </a>

        <a
          href={`https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          title="X (Twitter)"
          className={`${ghostPill} border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5`}
        >
          <span className="text-sm font-black leading-none">X</span>
        </a>

        <button
          type="button"
          onClick={handleCopy}
          title={t('share.copy')}
          aria-label={t('share.copy')}
          className={`${ghostPill} border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500/60 hover:text-indigo-600 dark:hover:text-indigo-400`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span>{copied ? t('share.copied') : t('share.copy')}</span>
        </button>
      </div>
    </header>
  );
};
