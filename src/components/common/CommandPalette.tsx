import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TOOLS } from '../../constants/tools';
import {
  Search,
  SearchX,
  Home,
  SunMoon,
  Languages,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { ToolId, Language } from '../../types';

/** Other components (navbar trigger) can open the palette with this event. */
export const OPEN_PALETTE_EVENT = 'toolzy:open-palette';

interface PaletteItem {
  id: string;
  group: 'tools' | 'actions';
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
}

const LANG_CYCLE: Language[] = ['ar', 'en', 'fr'];
const LANG_NAMES: Record<Language, string> = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
};

/**
 * Global ⌘K / Ctrl+K command palette: fuzzy-search every tool plus quick
 * actions (home, theme, language) with full keyboard navigation.
 */
export const CommandPalette: React.FC = () => {
  const { t, lang, setLang, theme, toggleTheme, setActiveTool } = useApp();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  /* ---------- open / close plumbing ---------- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpenEvent = () => setOpen(true);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    setQuery('');
    setActiveIndex(0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the field once the panel has painted
    const raf = requestAnimationFrame(() => inputRef.current?.focus());

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  /* ---------- items ---------- */
  const items = useMemo<PaletteItem[]>(() => {
    const toolItems: PaletteItem[] = TOOLS.map((tool) => ({
      id: `tool-${tool.id}`,
      group: 'tools' as const,
      label: t(tool.titleKey),
      hint: tool.badge,
      icon: React.createElement(
        'span',
        {
          className: `w-8 h-8 rounded-lg grid place-items-center shrink-0 text-white bg-gradient-to-br ${tool.gradient} shadow-sm`,
        },
        React.createElement(tool.icon, { className: 'w-4 h-4' })
      ),
      run: () => {
        setActiveTool(tool.id as ToolId);
        close();
      },
    }));

    const nextLang = LANG_CYCLE[(LANG_CYCLE.indexOf(lang) + 1) % LANG_CYCLE.length];

    const actionItems: PaletteItem[] = [
      {
        id: 'action-home',
        group: 'actions',
        label: t('palette.goHome'),
        hint: t('nav.home'),
        icon: (
          <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            <Home className="w-4 h-4" />
          </span>
        ),
        run: () => {
          setActiveTool('home');
          close();
        },
      },
      {
        id: 'action-theme',
        group: 'actions',
        label: t('palette.toggleTheme'),
        hint: theme === 'dark' ? t('nav.darkMode') : t('nav.lightMode'),
        icon: (
          <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <SunMoon className="w-4 h-4" />
          </span>
        ),
        run: () => {
          toggleTheme();
          close();
        },
      },
      {
        id: 'action-lang',
        group: 'actions',
        label: t('palette.changeLang'),
        hint: LANG_NAMES[nextLang],
        icon: (
          <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0 bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Languages className="w-4 h-4" />
          </span>
        ),
        run: () => {
          setLang(nextLang);
          close();
        },
      },
    ];

    return [...toolItems, ...actionItems];
  }, [t, lang, theme, setActiveTool, setLang, toggleTheme, close]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      `${item.label} ${item.hint ?? ''}`.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Keep the highlighted row in sync when results shrink
  useEffect(() => {
    setActiveIndex((i) => (i >= filtered.length ? 0 : i));
  }, [filtered.length]);

  // Scroll the active row into view
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  /* ---------- keyboard handling ---------- */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === 'Enter') {
      // A focused row fires its own native click — don't run the action twice
      if ((e.target as HTMLElement | null)?.tagName === 'BUTTON') return;
      e.preventDefault();
      filtered[activeIndex]?.run();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      // Trap focus inside the dialog while it is open
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'input, button, [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = !!active && !!panelRef.current?.contains(active);
      if (!inside || (e.shiftKey && active === first)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!open) return null;

  const renderRow = (item: PaletteItem, index: number) => {
    const isActive = index === activeIndex;
    return (
      <button
        key={item.id}
        id={`palette-${item.id}`}
        data-index={index}
        role="option"
        aria-selected={isActive}
        onMouseMove={() => setActiveIndex(index)}
        onClick={item.run}
        className={`w-full text-start flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors ${
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-inset ring-indigo-500/30'
            : 'hover:bg-gray-100 dark:hover:bg-white/5'
        }`}
      >
        {item.icon}
        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-bold truncate ${
              isActive
                ? 'text-indigo-700 dark:text-indigo-300'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {item.label}
          </span>
          {item.hint && (
            <span className="block text-[11px] truncate text-gray-500 dark:text-gray-400">
              {item.hint}
            </span>
          )}
        </span>
        {isActive && (
          <CornerDownLeft className="w-3.5 h-3.5 shrink-0 text-indigo-500 rtl:-scale-x-100" />
        )}
      </button>
    );
  };

  let rowIndex = -1;
  const toolRows = filtered
    .filter((item) => item.group === 'tools')
    .map((item) => {
      rowIndex += 1;
      return renderRow(item, rowIndex);
    });
  const actionRows = filtered
    .filter((item) => item.group === 'actions')
    .map((item) => {
      rowIndex += 1;
      return renderRow(item, rowIndex);
    });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh] sm:pt-[16vh]"
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.quickSearch')}
      onKeyDown={onKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-950/55 backdrop-blur-md animate-in fade-in"
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-xl rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-pop overflow-hidden animate-in zoom-in-95 origin-top"
      >
        {/* Search field */}
        <div className="flex items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-800">
          <Search className="w-4 h-4 shrink-0 text-indigo-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder={t('palette.placeholder')}
            aria-label={t('palette.placeholder')}
            aria-controls="palette-list"
            aria-activedescendant={filtered[activeIndex] ? `palette-${filtered[activeIndex].id}` : undefined}
            className="flex-1 bg-transparent border-none outline-none py-4 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          <kbd className="kbd hidden sm:inline-flex">Esc</kbd>
        </div>

        {/* Results */}
        <div
          id="palette-list"
          ref={listRef}
          role="listbox"
          className="max-h-[52vh] overflow-y-auto p-2 space-y-1"
        >
          {filtered.length === 0 && (
            <div className="py-10 text-center space-y-2 animate-in fade-in">
              <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
                <SearchX className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {t('palette.noResults')}
              </p>
            </div>
          )}

          {toolRows.length > 0 && (
            <div role="group" aria-label={t('palette.sectionTools')} className="space-y-1">
              <p className="eyebrow px-3 pt-1.5 pb-1">{t('palette.sectionTools')}</p>
              {toolRows}
            </div>
          )}

          {actionRows.length > 0 && (
            <div role="group" aria-label={t('palette.sectionActions')} className="space-y-1">
              <p className="eyebrow px-3 pt-3 pb-1 border-t border-gray-100 dark:border-gray-800">
                {t('palette.sectionActions')}
              </p>
              {actionRows}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/40 flex items-center gap-4 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1">
            <kbd className="kbd"><ArrowUp className="w-2.5 h-2.5" /></kbd>
            <kbd className="kbd"><ArrowDown className="w-2.5 h-2.5" /></kbd>
            {t('palette.hintNavigate')}
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="kbd"><CornerDownLeft className="w-2.5 h-2.5 rtl:-scale-x-100" /></kbd>
            {t('palette.hintSelect')}
          </span>
          <span className="inline-flex items-center gap-1 ms-auto">
            <kbd className="kbd">Esc</kbd>
            {t('palette.hintClose')}
          </span>
        </div>
      </div>
    </div>
  );
};
