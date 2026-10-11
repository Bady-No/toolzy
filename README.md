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

## 📊 Admin dashboard (visitor stats)

The site has a private stats page at **`#admin`** (not linked anywhere): login with your
admin email/password to see visits, unique visitors, a 30-day chart, most-used tools and
countries. Data is stored in [Supabase](https://supabase.com) (free tier).

What is collected: day, page/tool, country, and a **salted SHA-256** of a random
per-browser ID. No cookies, no IPs, no personal data. Anonymous visitors can only
*insert* a visit row — only a signed-in admin can *read* anything (enforced by
database policies).

### One-time setup (~5 minutes)

1. Create a free project at <https://supabase.com> → **New project**.
2. Open **SQL Editor** and run this script:

   ```sql
   create table if not exists public.visits (
     id bigint generated always as identity primary key,
     created_at timestamptz not null default now(),
     day date not null,
     path text,
     tool_id text,
     country text,
     visitor_hash text
   );

   create index if not exists visits_day_idx on public.visits (day);

   alter table public.visits enable row level security;

   create policy "public may insert visits"
     on public.visits for insert to anon, authenticated
     with check (true);

   create policy "admins may read visits"
     on public.visits for select to authenticated
     using (true);
   ```

3. **Authentication → Users → Add user**: create your admin email + password.
   Then **Authentication → Sign in → Email**: turn **off** “Allow new users to sign up”.
4. Copy your **Project URL** and **anon/public key** (Settings → API keys) into
   `src/config/admin.ts`.
5. Commit & push. Open `https://<your-site>/toolzy/#admin` and sign in.

Until step 4 is done, the tracker stays silent and `#admin` shows a setup notice —
so it is safe to deploy before configuring.

## 📁 Project structure

```
src/
├── components/
│   ├── admin/      Private #admin dashboard (lazy-loaded, Supabase auth)
│   ├── common/    Navbar, CommandPalette, Dropzone, ToolHeader, ShareButton, …
│   ├── home/      Landing hero + searchable tool grid
│   └── tools/     One component per tool
├── config/         Supabase connection for the admin dashboard
├── constants/     Tool registry (ids, icons, gradients, badges)
├── context/       App state: active tool (hash routing), theme, language, toasts
├── i18n/          Translations (ar / en / fr)
├── lib/           Anonymous visit tracker
└── utils/         Image/PDF/QR processing + clipboard helpers (all client-side)
```

## Privacy

No uploads, no servers, no cookies, no personal data. Every file is processed locally
in your browser — offline capable. If the optional admin dashboard is connected, the
site counts anonymous visits (day, page, country, salted hash of a random ID) and
nothing else.

---

Developed by **Elbaraka Group** (مجموعة البركة).
