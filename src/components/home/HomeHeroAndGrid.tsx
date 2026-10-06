import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Zap,
  WifiOff,
  Lock,
  Search,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  SearchX,
  Gift,
  FileText,
  QrCode,
  RefreshCw,
  Scissors,
  type LucideIcon,
} from 'lucide-react';
import { TOOLS } from '../../constants/tools';
import { ShareButton } from '../common/ShareButton';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Eased count-up used by the hero stats (skipped for reduced motion). */
const useCountUp = (target: number, duration = 1300): number => {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
};

const StatItem: React.FC<{
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
  icon: LucideIcon;
  tone: string;
}> = ({ target, prefix = '', suffix = '', label, icon: StatIcon, tone }) => {
  const value = useCountUp(target);
  return (
    <div className="surface rounded-2xl px-4 py-3.5 flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        <StatIcon className={`w-4 h-4 ${tone}`} />
        <span className="text-lg font-black text-gray-900 dark:text-white leading-none tabular-nums">
          {prefix}
          {value}
          {suffix}
        </span>
      </div>
      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 text-center">
        {label}
      </span>
    </div>
  );
};

export const HomeHeroAndGrid: React.FC = () => {
  const { lang, setActiveTool, t } = useApp();
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Scroll-reveal: fade sections in as they approach the viewport
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -64px 0px' }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Cursor-tracking spotlight on the tool cards
  const trackSpotlight = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  const ArrowIcon = lang === 'ar' ? ArrowLeft : ArrowRight;

  // Decorative tool chips levitating around the hero (xl and up only)
  const floatingChips = [
    { icon: FileText, label: 'PDF', tone: 'text-rose-500', className: 'top-24 start-0', style: { '--rot': '-7deg', animationDelay: '-1.2s' } },
    { icon: QrCode, label: 'QR', tone: 'text-amber-500', className: 'top-16 end-0', style: { '--rot': '6deg', animationDelay: '-3.4s' } },
    { icon: RefreshCw, label: 'WebP', tone: 'text-indigo-500', className: 'top-72 start-5', style: { '--rot': '5deg', animationDelay: '-5.1s' } },
    { icon: Scissors, label: 'PNG', tone: 'text-emerald-500', className: 'top-64 end-4', style: { '--rot': '-5deg', animationDelay: '-2.3s' } },
  ];

  // "/" focuses the tool search, like a modern command palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOLS;
    return TOOLS.filter((tool) => {
      const haystack = [
        t(tool.titleKey),
        t(tool.shortDescKey),
        tool.badge,
        ...tool.keywords,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, t]);

  const stats = [
    { target: 7, label: t('home.statTools'), icon: Sparkles, tone: 'text-indigo-500' },
    { target: 100, suffix: '%', label: t('home.statLocal'), icon: ShieldCheck, tone: 'text-emerald-500' },
    { target: 0, label: t('home.statUploads'), icon: WifiOff, tone: 'text-sky-500' },
    { target: 0, prefix: '$', label: t('home.statFree'), icon: Gift, tone: 'text-amber-500' },
  ];

  const scrollToGrid = () => {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={rootRef} className="relative space-y-16 sm:space-y-20 py-2">
      {/* Floating decorative chips (wrapped so spacing utilities never touch them) */}
      <div className="pointer-events-none" aria-hidden="true">
        {floatingChips.map((chip) => {
          const ChipIcon = chip.icon;
          return (
            <span
              key={chip.label}
              className={`hero-chip ${chip.className}`}
              style={chip.style as React.CSSProperties}
            >
              <ChipIcon className={`w-3.5 h-3.5 ${chip.tone}`} />
              {chip.label}
            </span>
          );
        })}
      </div>

      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden text-center max-w-4xl mx-auto space-y-7 pt-4 sm:pt-10 pb-2">
        <div className="aurora -top-24 -start-20 w-72 h-72 bg-indigo-400/50 dark:bg-indigo-600/40" aria-hidden="true" />
        <div
          className="aurora -top-10 -end-24 w-64 h-64 bg-ink-300/45 dark:bg-ink-600/50"
          style={{ animationDelay: '-6s' }}
          aria-hidden="true"
        />

        <div className="relative stagger space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 dark:bg-gray-900/70 backdrop-blur border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold shadow-card">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('app.privacyGuarantee')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-gradient text-gradient-shimmer">
            {t('app.heroTitle')}
          </h1>

          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {t('app.heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTool('compress')}
              className="btn btn-primary btn-shine w-full sm:w-auto px-6 py-3 text-sm"
            >
              <Zap className="w-4 h-4" />
              <span>{t('home.ctaStart')}</span>
              <ArrowIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={scrollToGrid}
              className="btn btn-secondary w-full sm:w-auto px-6 py-3 text-sm"
            >
              <Search className="w-4 h-4" />
              <span>{t('app.exploreTools')}</span>
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative stagger grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2">
          {stats.map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* ============ Tools grid ============ */}
      <section ref={gridRef} className="reveal max-w-7xl mx-auto scroll-mt-24 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 text-start">
            <p className="eyebrow">{t('app.badge')}</p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              {t('nav.tools')}
            </h2>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('home.searchPlaceholder')}
              aria-label={t('home.searchPlaceholder')}
              className="field ps-9 pe-11"
            />
            <kbd className="kbd absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex">
              /
            </kbd>
          </div>
        </div>

        <div className="stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div key={tool.id} className="relative group/card">
                <button
                  type="button"
                  onClick={() => setActiveTool(tool.id)}
                  onPointerMove={trackSpotlight}
                  className="card-interactive card-spotlight group w-full h-full text-start rounded-2xl p-4 sm:p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-card flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/70 dark:border-gray-700/60">
                        {tool.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {t(tool.titleKey)}
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {t(tool.shortDescKey)}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-gray-100 dark:border-gray-800 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <span className="inline-flex items-center gap-1.5">
                      {t('nav.openTool')}
                      <ArrowIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                    </span>
                  </div>
                </button>

                {/* Share this tool — hover-reveal on desktop, always visible on touch widths */}
                <ShareButton
                  toolId={tool.id}
                  wrapperClassName="absolute bottom-3 end-3 z-10 transition-opacity duration-200 lg:opacity-0 lg:group-hover/card:opacity-100 lg:group-focus-within/card:opacity-100"
                />
              </div>
            );
          })}

          {/* Privacy & architecture card */}
          <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-ink-800 via-indigo-700 to-indigo-500 text-white shadow-raised flex flex-col justify-between relative overflow-hidden">
            <div
              className="absolute -top-16 -end-16 w-48 h-48 rounded-full bg-white/10 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-emerald-200 mb-4 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black mb-2">
                {lang === 'ar'
                  ? 'خصوصية وأمان 100%'
                  : lang === 'fr'
                  ? '100% Côté Client'
                  : '100% Client-Side'}
              </h3>
              <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                {lang === 'ar'
                  ? 'جميع العمليات الحسابية تتم مباشرة في ذاكرة متصفحك دون رفع أي بيانات إلى خوادم خارجية.'
                  : lang === 'fr'
                  ? "Tous les calculs et traitements s'effectuent directement dans la mémoire de votre navigateur."
                  : 'All processing happens directly in your browser memory without uploading any data.'}
              </p>
            </div>

            <div className="relative pt-5 mt-4 border-t border-white/20 flex items-center justify-between text-xs font-bold text-emerald-200">
              <span>
                {lang === 'ar'
                  ? 'معالجة محلية بالكامل'
                  : lang === 'fr'
                  ? 'Traitement 100% local'
                  : 'End-to-End Local Execution'}
              </span>
              <Lock className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filteredTools.length === 0 && (
          <div className="rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 py-14 px-6 text-center space-y-3 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
              <SearchX className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              {t('home.noResults')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('home.noResultsHint')}
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="btn btn-secondary px-4 py-2 text-xs mx-auto"
            >
              {t('home.clearSearch')}
            </button>
          </div>
        )}
      </section>

      {/* ============ Privacy deep dive ============ */}
      <section className="reveal relative max-w-5xl mx-auto rounded-3xl p-8 sm:p-12 overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 shadow-card text-center space-y-8">
        <div
          className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative space-y-3 max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            {t('privacySection.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {t('privacySection.p1')} {t('privacySection.p2')}
          </p>
        </div>

        <div className="stagger relative grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4">
          {[
            { icon: ShieldCheck, key: '1', tone: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
            { icon: Zap, key: '2', tone: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' },
            { icon: WifiOff, key: '3', tone: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
          ].map((item) => {
            const ItemIcon = item.icon;
            return (
              <div
                key={item.key}
                className="p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 space-y-2 transition-transform duration-300 hover:-translate-y-1 hover:shadow-raised"
              >
                <div
                  className={`w-9 h-9 rounded-xl ${item.tone} flex items-center justify-center mx-auto`}
                >
                  <ItemIcon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  {t(`privacySection.badge${item.key}`)}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t(`privacySection.sub${item.key}`)}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
