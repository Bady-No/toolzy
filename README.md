<div dir="rtl" align="center">

# Toolzy — تولزي

**أدوات الصور والمستندات الذكية · Smart Image & Document Utilities**

7 أداة احترافية تعمل **بالكامل داخل المتصفح** — بدون رفع، بدون علامات مائية، بدون إنترنت.

[![Deploy](https://github.com/Bady-No/toolzy/actions/workflows/deploy.yml/badge.svg)](https://github.com/Bady-No/toolzy/actions/workflows/deploy.yml)
[![Live](https://img.shields.io/badge/live-GitHub%20Pages-7F46F7)](https://bady-no.github.io/toolzy/)

🌐 **Live:** https://bady-no.github.io/toolzy/

</div>

---

## ✨ Tools

| Tool | What it does |
| --- | --- |
| 🗜️ **Compress** | Shrink images (JPG/PNG/WebP) with live quality control and size comparison |
| 🔄 **Convert** | Convert between image formats entirely in the browser |
| 📄 **PDF** | Merge and compress PDF documents |
| 🪄 **Remove Background** | Cut out image backgrounds locally |
| 📐 **Resize** | Batch-resize images to exact dimensions |
| 🟩 **QR Generator** | Create QR codes (URL, text, Wi-Fi, email, phone, vCard) with logo support |
| 📷 **QR Reader** | Read QR codes from images |

**Also included**

- 🔍 **Command palette** — `⌘K` / `Ctrl+K` to jump to any tool or action
- 📱 **PWA** — installable, works offline (service worker + manifest)
- 🌍 **Trilingual UI** — العربية / English / French, full RTL support
- 🔗 **Deep links & sharing** — every tool has its own URL (`/#compress`) plus one-tap WhatsApp / Telegram / X share buttons
- 🔒 **100% client-side** — files never leave the device

## 🛠 Tech stack

React 19 · Vite 8 · Tailwind CSS 4 · TypeScript · pdf-lib · jsQR · qrcode · jszip · lucide-react

## 🚀 Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build → dist/
npm run lint     # TypeScript type-check
npm run preview  # serve the production build
```

No API keys required — everything runs in the browser. (`.env.example` is a leftover from the AI Studio template; the app doesn't use it.)

## 🌐 Deployment

Pushing to `main` automatically builds and deploys to **GitHub Pages** via GitHub Actions (`.github/workflows/deploy.yml`).

- The base path is set in `vite.config.ts` (`base: '/toolzy/'`) — change it to `'/'` if you host at a domain root or rename the repo.
- GitHub Pages must be enabled once: **Settings → Pages → Source: GitHub Actions**.

## 📁 Project structure

```
src/
├── components/
│   ├── common/    Navbar, CommandPalette, Dropzone, ToolHeader, ShareButton, …
│   ├── home/      Landing hero + searchable tool grid
│   └── tools/     One component per tool
├── constants/     Tool registry (ids, icons, gradients, badges)
├── context/       App state: active tool (hash routing), theme, language, toasts
├── i18n/          Translations (ar / en / fr)
└── utils/         Image/PDF/QR processing + clipboard helpers (all client-side)
```

## Privacy

No uploads, no servers, no tracking. Every file is processed locally in your browser — offline capable.

---

Developed by **Elbaraka Group** (مجموعة البركة).
