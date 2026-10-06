import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Sun,
  Moon,
  Languages,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react';
import { ToolId } from '../../types';
import { TOOLS, getTool } from '../../constants/tools';
import { OPEN_PALETTE_EVENT } from './CommandPalette';

export const Navbar: React.FC = () => {
  const {
    lang,
    setLang,
    theme,
    toggleTheme,
    activeTool,
    setActiveTool,
    t,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const homePillRef = useRef<HTMLButtonElement>(null);
  const toolsPillRef = useRef<HTMLButtonElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);
  const [indicatorPrimed, setIndicatorPrimed] = useState(false);
  const indicatorPrimedRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      // Written straight to the DOM — no React re-render per scroll frame
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      progressRef.current?.style.setProperty('--progress', String(p));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Sliding indicator that glides behind the active desktop nav pill
  useEffect(() => {
    const update = () => {
      const container = navRef.current;
      const target = activeTool === 'home' ? homePillRef.current : toolsPillRef.current;
      if (!container || !target) return;
      const rect = target.getBoundingClientRect();
      if (rect.width === 0) return; // nav is hidden below md
      const base = container.getBoundingClientRect();
      setIndicator({ x: rect.left - base.left - 3, w: rect.width + 6 });

      // First measurement lands without animating (avoids a white-text flash);
      // only from then on do position changes glide.
      if (!indicatorPrimedRef.current) {
        indicatorPrimedRef.current = true;
        requestAnimationFrame(() => requestAnimationFrame(() => setIndicatorPrimed(true)));
      }
    };

    update();
    const raf = requestAnimationFrame(update);
    // Web fonts change pill widths once they swap in
    document.fonts?.ready.then(update).catch(() => undefined);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      cancelAnimationFrame(raf);
    };
  }, [activeTool, lang]);

  const openPalette = () => {
    setToolsDropdownOpen(false);
    setLangDropdownOpen(false);
    setMobileMenuOpen(false);
    window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
  };

  const activeMeta = getTool(activeTool);

  // Close popovers on outside click / Escape
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (toolsRef.current && !toolsRef.current.contains(target)) setToolsDropdownOpen(false);
      if (langRef.current && !langRef.current.contains(target)) setLangDropdownOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setToolsDropdownOpen(false);
        setLangDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Full-screen mobile sheet: lock background scroll and move focus inside
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sheetRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  // Collapse the sheet if the viewport grows past the mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileMenuOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const languages: Array<{ code: 'ar' | 'en' | 'fr'; nativeName: string; flag: string }> = [
    { code: 'ar', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'en', nativeName: 'English', flag: '🇬🇧' },
    { code: 'fr', nativeName: 'Français', flag: '🇫🇷' },
  ];

  const handleNav = (tool: ToolId) => {
    setActiveTool(tool);
    setMobileMenuOpen(false);
    setToolsDropdownOpen(false);
    setLangDropdownOpen(false);
  };

  const navPill = (active: boolean) =>
    `relative z-10 px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors duration-300 inline-flex items-center gap-1.5 focus-visible:outline-2 ${
      active
        ? 'text-white'
        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/10'
    }`;

  const iconBtn =
    'h-9 w-9 grid place-items-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-3 sm:px-5 pt-3">
        <div
          className={`navbar-accent relative mx-auto max-w-7xl flex items-center gap-2 sm:gap-4 rounded-2xl border px-3 sm:px-4 transition-all duration-300 ${
            scrolled
              ? 'navbar-accent-on h-14 sm:h-14 bg-white/85 dark:bg-gray-900/85 border-gray-200 dark:border-gray-800 shadow-[0_18px_40px_-24px_rgb(16_22_30/0.55)] backdrop-blur-xl'
              : 'h-14 sm:h-16 bg-white/55 dark:bg-gray-950/45 border-white/70 dark:border-white/10 backdrop-blur-md'
          }`}
        >
          {/* Reading progress across the whole page */}
          <span ref={progressRef} className="scroll-progress" aria-hidden="true" />
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => handleNav('home')}
              className="group inline-flex items-center cursor-pointer rounded-lg"
              aria-label={t('nav.home')}
            >
              <img
                src={`${import.meta.env.BASE_URL}logo-toolzy.png`}
                alt="Toolzy"
                width={959}
                height={364}
                className="h-7 sm:h-8 w-auto shrink-0 transition-transform duration-300 group-hover:scale-105 dark:brightness-0 dark:invert"
              />
            </button>

            <span
              aria-hidden="true"
              className="hidden lg:block w-px h-6 bg-gray-200 dark:bg-gray-800"
            />

            {/* Tagline on home, live breadcrumb inside a tool */}
            {activeTool === 'home' || !activeMeta ? (
              <p className="hidden lg:block text-xs text-gray-500 dark:text-gray-400 truncate max-w-[15rem]">
                {t('app.tagline')}
              </p>
            ) : (
              <div className="hidden lg:flex items-center gap-1.5 text-xs min-w-0">
                <button
                  onClick={() => handleNav('home')}
                  className="font-semibold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {t('nav.home')}
                </button>
                <ChevronRight
                  aria-hidden="true"
                  className={`w-3 h-3 shrink-0 text-gray-300 dark:text-gray-600 ${
                    lang === 'ar' ? 'rotate-180' : ''
                  }`}
                />
                <span aria-current="page" className="font-bold text-gray-900 dark:text-white truncate">
                  {t(activeMeta.titleKey)}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Nav */}
          <nav
            ref={navRef}
            className="relative hidden md:flex items-center gap-1.5"
            aria-label={t('nav.tools')}
          >
            {/* Gliding active indicator */}
            <span
              aria-hidden="true"
              className="nav-indicator"
              style={{
                transform: `translateX(${indicator?.x ?? 0}px)`,
                width: indicator?.w ?? 0,
                opacity: indicator ? 1 : 0,
                transition: indicatorPrimed ? undefined : 'none',
              }}
            />

            <button
              ref={homePillRef}
              onClick={() => handleNav('home')}
              className={navPill(activeTool === 'home')}
              aria-current={activeTool === 'home' ? 'page' : undefined}
            >
              {t('nav.home')}
            </button>

            {/* Tools: mega dropdown */}
            <div className="relative" ref={toolsRef}>
              <button
                ref={toolsPillRef}
                onClick={() => setToolsDropdownOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={toolsDropdownOpen}
                className={navPill(activeTool !== 'home')}
              >
                <span>{t('nav.tools')}</span>
                <span className="text-[10px] font-black px-1.5 py-px rounded-full bg-white/20 dark:bg-white/10 tabular-nums">
                  {TOOLS.length}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    toolsDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {toolsDropdownOpen && (
                <div
                  role="menu"
                  className="absolute top-full start-0 mt-3 w-[min(88vw,42rem)] p-2 rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-pop border border-gray-200/80 dark:border-gray-800 z-50 animate-in fade-in zoom-in-95 origin-top"
                >
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="eyebrow">{t('nav.tools')}</span>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                      {t('app.tagline')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {TOOLS.map((tool) => {
                      const Icon = tool.icon;
                      const active = activeTool === tool.id;
                      return (
                        <button
                          key={tool.id}
                          role="menuitem"
                          onClick={() => handleNav(tool.id)}
                          className={`w-full text-start px-3 py-2.5 rounded-2xl flex items-center gap-3 transition-all duration-200 ${
                            active
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                              : 'hover:bg-gray-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <span
                            className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 text-white ${
                              active
                                ? 'bg-white/20'
                                : `bg-gradient-to-br ${tool.gradient} shadow-sm`
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold truncate">
                              {t(tool.titleKey)}
                            </span>
                            <span
                              className={`block text-[11px] truncate ${
                                active ? 'text-white/75' : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {t(tool.shortDescKey)}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right actions */}
          <div className="ms-auto flex items-center gap-2">
            {/* Privacy badge */}
            <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('app.badge')}</span>
            </div>

            {/* Single control cluster: search · language · theme · menu */}
            <div className="flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white/60 dark:bg-white/5">
              <button
                type="button"
                onClick={openPalette}
                className="h-8 px-2 inline-flex items-center gap-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                aria-label={t('nav.quickSearch')}
                title={`${t('nav.quickSearch')} (⌘K)`}
              >
                <Search className="w-4 h-4" />
                <kbd className="kbd hidden sm:inline-flex">⌘K</kbd>
              </button>
              <span
                aria-hidden="true"
                className="block w-px h-5 bg-gray-200 dark:bg-gray-800 mx-1"
              />

              {/* Language dropdown */}
              <div className="relative hidden sm:block" ref={langRef}>
                <button
                  onClick={() => setLangDropdownOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={langDropdownOpen}
                  title={t('nav.switchLang')}
                  aria-label={t('nav.switchLang')}
                  className="h-8 px-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors inline-flex items-center gap-1.5"
                >
                  <Languages className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{lang === 'ar' ? 'AR' : lang === 'fr' ? 'FR' : 'EN'}</span>
                  <ChevronDown
                    className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                      langDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {langDropdownOpen && (
                  <div
                    role="menu"
                    className="absolute top-full end-0 mt-3 w-48 p-1.5 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-pop border border-gray-200/80 dark:border-gray-800 z-50 animate-in fade-in zoom-in-95 origin-top"
                  >
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        role="menuitemradio"
                        aria-checked={lang === l.code}
                        onClick={() => {
                          setLang(l.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-start px-2.5 py-2 text-sm font-semibold rounded-xl flex items-center justify-between transition-colors ${
                          lang === l.code
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base leading-none">{l.flag}</span>
                          <span>{l.nativeName}</span>
                        </span>
                        {lang === l.code && <span className="text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span
                aria-hidden="true"
                className="hidden sm:block w-px h-5 bg-gray-200 dark:bg-gray-800 mx-1"
              />

              {/* Theme segmented control */}
              <div
                role="group"
                aria-label={t('nav.lightMode')}
                className="flex items-center gap-0.5"
              >
                <button
                  onClick={() => {
                    if (theme === 'dark') toggleTheme();
                  }}
                  aria-pressed={theme === 'light'}
                  aria-label={t('nav.lightMode')}
                  title={t('nav.lightMode')}
                  className={`h-8 w-8 rounded-full grid place-items-center transition-all duration-200 ${
                    theme === 'light'
                      ? 'bg-white shadow-sm text-amber-500'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (theme === 'light') toggleTheme();
                  }}
                  aria-pressed={theme === 'dark'}
                  aria-label={t('nav.darkMode')}
                  title={t('nav.darkMode')}
                  className={`h-8 w-8 rounded-full grid place-items-center transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-indigo-600 shadow-sm text-white'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>

              <span
                aria-hidden="true"
                className="md:hidden block w-px h-5 bg-gray-200 dark:bg-gray-800 mx-1"
              />

              {/* Mobile menu toggle — lives in the cluster so small screens
                  get one clean group instead of scattered boxes */}
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden h-8 w-8 grid place-items-center rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                aria-label={t('nav.menu')}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen mobile sheet */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.menu')}
        >
          <div
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            ref={sheetRef}
            tabIndex={-1}
            className="absolute inset-x-3 top-3 max-h-[calc(100dvh_-_1.5rem)] overflow-y-auto rounded-3xl border border-white/70 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-pop p-4 animate-in fade-in zoom-in-95 origin-top focus:outline-none"
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <img
                src={`${import.meta.env.BASE_URL}logo-toolzy.png`}
                alt="Toolzy"
                width={959}
                height={364}
                className="h-7 w-auto dark:brightness-0 dark:invert"
              />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={iconBtn}
                aria-label={t('nav.close')}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Language segmented control */}
            <div className="p-1 rounded-2xl bg-gray-100 dark:bg-white/5 grid grid-cols-3 gap-1">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  aria-pressed={lang === l.code}
                  className={`py-2 text-xs font-bold rounded-xl transition-all inline-flex items-center justify-center gap-1.5 ${
                    lang === l.code
                      ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className="text-sm leading-none">{l.flag}</span>
                  <span>{l.nativeName}</span>
                </button>
              ))}
            </div>

            {/* Home */}
            <button
              onClick={() => handleNav('home')}
              className={`mt-4 w-full px-4 py-3 text-sm font-bold rounded-2xl flex items-center gap-2.5 transition-colors ${
                activeTool === 'home'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {t('nav.home')}
            </button>

            {/* Tools */}
            <div className="mt-5">
              <p className="eyebrow px-1 mb-2">{t('nav.tools')}</p>
              <div className="grid grid-cols-1 gap-1.5">
                {TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  const active = activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleNav(tool.id)}
                      className={`w-full text-start px-3 py-2.5 rounded-2xl flex items-center gap-3 transition-colors ${
                        active
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                          : 'hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 text-white ${
                          active ? 'bg-white/20' : `bg-gradient-to-br ${tool.gradient} shadow-sm`
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold truncate">{t(tool.titleKey)}</span>
                        <span
                          className={`block text-[11px] truncate ${
                            active ? 'text-white/75' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {t(tool.shortDescKey)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
