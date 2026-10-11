import React, { Suspense, useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { CommandPalette } from './components/common/CommandPalette';
import { logVisit } from './lib/analytics';

import { HomeHeroAndGrid } from './components/home/HomeHeroAndGrid';
import { ImageCompressor } from './components/tools/ImageCompressor';
import { FormatConverter } from './components/tools/FormatConverter';
import { PdfTool } from './components/tools/PdfTool';
import { BackgroundRemover } from './components/tools/BackgroundRemover';
import { BatchResizer } from './components/tools/BatchResizer';
import { QrGenerator } from './components/tools/QrGenerator';
import { QrReader } from './components/tools/QrReader';

// Private stats page — code-split so visitors never download it
const AdminPanel = React.lazy(() => import('./components/admin/AdminPanel'));

const AppContent: React.FC = () => {
  const { activeTool } = useApp();
  const [isAdmin, setIsAdmin] = useState(
    () => window.location.hash === '#admin'
  );

  useEffect(() => {
    const sync = () => setIsAdmin(window.location.hash === '#admin');
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  // Anonymous visit counter (no-op until Supabase is configured)
  useEffect(() => {
    if (!isAdmin) logVisit(activeTool);
  }, [activeTool, isAdmin]);

  useEffect(() => {
    // Register PWA service worker if supported
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        const base = import.meta.env.BASE_URL;
        navigator.serviceWorker
          .register(`${base}sw.js`, { scope: base })
          .catch((err) => {
            console.warn('PWA service worker registration failed: ', err);
          });
      });
    }
  }, []);

  const renderTool = () => {
    switch (activeTool) {
      case 'compress':
        return <ImageCompressor />;
      case 'convert':
        return <FormatConverter />;
      case 'pdf':
        return <PdfTool />;
      case 'remove-bg':
        return <BackgroundRemover />;
      case 'resize':
        return <BatchResizer />;
      case 'qr-generate':
        return <QrGenerator />;
      case 'qr-read':
        return <QrReader />;
      case 'home':
      default:
        return <HomeHeroAndGrid />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-gray-900 dark:text-gray-100">
      {/* Ambient brand background */}
      <div className="app-ambient" aria-hidden="true" />

      <Navbar />

      {/* Top padding reserves the fixed navbar's height (12px pad + h-14/h-16 bar) + old py-8/10 gap */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[100px] sm:pt-[116px] pb-8 sm:pb-10">
        {isAdmin ? (
          <Suspense
            fallback={
              <div className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">
                Loading…
              </div>
            }
          >
            <AdminPanel />
          </Suspense>
        ) : (
          /* Re-mounts on navigation so every screen gets a clean entrance */
          <div key={activeTool} className="page-enter">
            {renderTool()}
          </div>
        )}
      </main>

      <Footer />
      <ToastContainer />
      <CommandPalette />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
