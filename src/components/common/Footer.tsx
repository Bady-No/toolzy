import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, WifiOff, Zap, Sparkles, Smartphone } from 'lucide-react';
import { TOOLS } from '../../constants/tools';

export const Footer: React.FC = () => {
  const { lang, setActiveTool, t } = useApp();
  const year = new Date().getFullYear();

  const toolLinks = TOOLS.map((tool) => ({ id: tool.id, name: t(tool.titleKey) }));

  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-colors mt-auto">
      {/* Privacy Banner */}
      <div className="bg-indigo-600/5 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {t('app.privacyGuarantee')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('footer.privacyNote')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>WebAssembly & Canvas</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <WifiOff className="w-3.5 h-3.5 text-indigo-500" />
              <span>Offline Ready PWA</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand info & Elbaraka Group acknowledgment */}
          <div className="md:col-span-4 space-y-3.5">
            <img
              src={`${import.meta.env.BASE_URL}logo-toolzy.png`}
              alt="Toolzy"
              width={959}
              height={364}
              className="h-8 w-auto transition-transform hover:scale-105 dark:brightness-0 dark:invert"
            />

            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed">
              {t('app.heroSubtitle')}
            </p>

            {/* Created by Elbaraka Group Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-ink-100 dark:from-indigo-950/40 dark:to-ink-900/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs font-bold text-indigo-800 dark:text-indigo-300 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {lang === 'ar' 
                  ? 'صُنع بواسطة مجموعة البركة • Created by Elbaraka Group' 
                  : lang === 'fr' 
                  ? 'Créé par Elbaraka Group' 
                  : 'Created by Elbaraka Group'}
              </span>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t('footer.builtForSpeed')}
            </p>
          </div>

          {/* Quick links to tools column 1 */}
          <div className="md:col-span-2 space-y-2">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {t('nav.tools')}
            </h4>
            <ul className="space-y-1.5 text-sm">
              {toolLinks.slice(0, 4).map((tool) => (
                <li key={tool.id}>
                  <button
                    onClick={() => setActiveTool(tool.id)}
                    className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {tool.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links to tools column 2 */}
          <div className="md:col-span-2 space-y-2">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {t('nav.tools')}
            </h4>
            <ul className="space-y-1.5 text-sm">
              {toolLinks.slice(4).map((tool) => (
                <li key={tool.id}>
                  <button
                    onClick={() => setActiveTool(tool.id)}
                    className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {tool.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile Apps Store Badges (App Store & Google Play - Coming Soon) */}
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {t('footer.mobileApps')}
              </h4>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lang === 'ar'
                ? 'تطبيقات الهواتف الذكية قادمة قريباً على متجري أبل وجوجل'
                : lang === 'fr'
                ? 'Applications mobiles bientôt disponibles sur App Store et Google Play'
                : 'Native mobile apps coming soon to the App Store and Google Play'}
            </p>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 pt-1">
              {/* Apple App Store */}
              <div
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-gray-950 text-white dark:bg-gray-900 border border-gray-800 dark:border-gray-800 shadow-sm opacity-90 hover:opacity-100 transition-all select-none"
                title={t('footer.comingSoon')}
              >
                {/* Apple SVG Icon */}
                <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.71-.93 2.73 1 .08 2.02-.48 2.64-1.23z" />
                </svg>
                <div className="text-start leading-tight">
                  <div className="text-[9px] uppercase tracking-wider text-gray-400">
                    {lang === 'ar' ? 'تنزيل من' : 'Download on the'}
                  </div>
                  <div className="text-xs font-bold font-sans">App Store</div>
                </div>
                <span className="ms-auto px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
                  {t('footer.comingSoon')}
                </span>
              </div>

              {/* Google Play Store */}
              <div
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-gray-950 text-white dark:bg-gray-900 border border-gray-800 dark:border-gray-800 shadow-sm opacity-90 hover:opacity-100 transition-all select-none"
                title={t('footer.comingSoon')}
              >
                {/* Google Play SVG Icon */}
                <svg className="w-5 h-5 fill-current shrink-0 ms-0.5" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186c-.339-.327-.55-.79-.55-1.306V3.12c0-.516.211-.979.55-1.306zm11.233 11.234l2.585 2.585-12.723 7.346 10.138-9.931zm0-2.096L4.704 1.021l12.723 7.346-2.585 2.585zm1.485 1.048l2.945-1.7c.974-.562.974-1.479 0-2.041l-2.945-1.7-1.884 1.885 1.884 1.885z" />
                </svg>
                <div className="text-start leading-tight">
                  <div className="text-[9px] uppercase tracking-wider text-gray-400">
                    {lang === 'ar' ? 'احصل عليه من' : 'GET IT ON'}
                  </div>
                  <div className="text-xs font-bold font-sans">Google Play</div>
                </div>
                <span className="ms-auto px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
                  {t('footer.comingSoon')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-start">
            <p>{t('footer.copyright', { year })}</p>
            <span>•</span>
            <div className="inline-flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
              <span>{lang === 'ar' ? 'صُنع بواسطة' : lang === 'fr' ? 'Créé par' : 'Created by'}</span>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/50">
                Elbaraka Group
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`${import.meta.env.BASE_URL}cookies.html`}
              className="font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {t('footer.cookies')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
