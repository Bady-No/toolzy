import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ToolId, Language, Theme, UserQuota, ToastMessage } from '../types';
import { translations } from '../i18n/translations';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  dir: 'rtl' | 'ltr';
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  activeTool: ToolId;
  setActiveTool: (tool: ToolId) => void;
  canProcessFile: (fileSizeBytes: number, isBgRemoval?: boolean) => { allowed: boolean; reason?: string };
  recordFileProcessed: (isBgRemoval?: boolean) => void;
  toasts: ToastMessage[];
  showToast: (title: string, type?: ToastMessage['type'], description?: string) => void;
  removeToast: (id: string) => void;
  t: (keyPath: string, vars?: Record<string, string | number>) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LANG: 'toolbox_lang',
  THEME: 'toolbox_theme',
  QUOTA: 'toolbox_quota',
};

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Language & Direction
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return saved === 'en' || saved === 'ar' || saved === 'fr' ? saved : 'ar';
  });

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEYS.LANG, newLang);
  };

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  // 2. Theme
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // 3. Navigation & URL Hash sync
  const [activeTool, setActiveToolState] = useState<ToolId>(() => {
    const hash = window.location.hash.replace('#', '');
    const validTools: ToolId[] = ['compress', 'convert', 'pdf', 'remove-bg', 'resize', 'qr-generate', 'qr-read'];
    if (validTools.includes(hash as ToolId)) {
      return hash as ToolId;
    }
    return 'home';
  });

  const setActiveTool = (tool: ToolId) => {
    setActiveToolState(tool);
    window.location.hash = tool === 'home' ? '' : tool;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTools: ToolId[] = ['compress', 'convert', 'pdf', 'remove-bg', 'resize', 'qr-generate', 'qr-read'];
      if (validTools.includes(hash as ToolId)) {
        setActiveToolState(hash as ToolId);
      } else if (!hash) {
        setActiveToolState('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 4. Local usage counter (nothing is metered — the whole app is free)
  const [quota, setQuota] = useState<UserQuota>(() => ({
    filesProcessedToday: 0,
    lastActiveDate: getTodayString(),
    bgRemovalsThisMonth: 0,
  }));

  const updateQuota = (updater: (prev: UserQuota) => UserQuota) => {
    setQuota((prev) => {
      const next = updater(prev);
      localStorage.setItem(STORAGE_KEYS.QUOTA, JSON.stringify(next));
      return next;
    });
  };

  const canProcessFile = (fileSizeBytes: number, _isBgRemoval = false): { allowed: boolean; reason?: string } => {
    // Every tool is free and unlimited; only the browser memory ceiling applies
    const maxMemorySize = 100 * 1024 * 1024; // 100 MB safe browser limit
    if (fileSizeBytes > maxMemorySize) {
      let reason = 'File size exceeds 100MB (browser memory limit).';
      if (lang === 'ar') {
        reason = 'حجم الملف يتجاوز 100 ميجابايت (الحد الأقصى لذاكرة المتصفح).';
      } else if (lang === 'fr') {
        reason = 'La taille du fichier dépasse 100 Mo (limite mémoire du navigateur).';
      }
      return { allowed: false, reason };
    }

    return { allowed: true };
  };

  const recordFileProcessed = (isBgRemoval = false) => {
    updateQuota((prev) => ({
      ...prev,
      filesProcessedToday: prev.filesProcessedToday + 1,
      bgRemovalsThisMonth: isBgRemoval ? prev.bgRemovalsThisMonth + 1 : prev.bgRemovalsThisMonth,
    }));
  };

  // 5. Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, type: ToastMessage['type'] = 'info', description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, type, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 6. Translator with automatic fallback
  const t = useCallback((keyPath: string, vars?: Record<string, string | number>): string => {
    const keys = keyPath.split('.');
    let current: any = translations[lang] || translations.en;
    let found = true;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        found = false;
        break;
      }
    }
    // Fallback to English if not found
    if (!found || typeof current !== 'string') {
      let fallback: any = translations.en;
      for (const key of keys) {
        if (fallback && typeof fallback === 'object' && key in fallback) {
          fallback = fallback[key];
        } else {
          return keyPath;
        }
      }
      current = fallback;
    }

    if (typeof current !== 'string') return keyPath;
    let result = current;
    if (vars) {
      for (const [vKey, vVal] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{${vKey}\\}`, 'g'), String(vVal));
      }
    }
    return result;
  }, [lang]);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        dir,
        theme,
        setTheme,
        toggleTheme,
        activeTool,
        setActiveTool,
        canProcessFile,
        recordFileProcessed,
        toasts,
        showToast,
        removeToast,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
