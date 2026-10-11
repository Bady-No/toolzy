/**
 * Anonymous visit tracker.
 *
 * Privacy design (matches the site's promise):
 *   • no cookies, no personal data, no IP addresses stored
 *   • each browser gets ONE random ID that identifies nothing but itself;
 *     only a salted SHA-256 of it ever leaves the device
 *   • country comes from a single lookup (ipwho.is) cached for a week
 *   • tracking is best-effort: failures are swallowed, the app never breaks
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '../config/admin';

const DAY_MS = 86_400_000;
const VID_KEY = 'tz_vid';
const COUNTRY_KEY = 'tz_country';
const LAST_VISIT_KEY = 'tz_last_visit';

const today = (): string => new Date().toISOString().slice(0, 10);

/** Random per-browser id, created once and kept in localStorage. */
const getVisitorId = (): string => {
  try {
    let id = localStorage.getItem(VID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VID_KEY, id);
    }
    return id;
  } catch {
    return 'no-storage';
  }
};

/** Salted SHA-256 hex digest — the raw id never leaves the device. */
const visitorHash = async (): Promise<string> => {
  const bytes = new TextEncoder().encode(`${getVisitorId()}:toolzy-visit-salt-v1`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/** Two-letter country code, looked up once and cached for a week. */
const getCountry = async (): Promise<string> => {
  try {
    const cached = localStorage.getItem(COUNTRY_KEY);
    if (cached) {
      const [ts, code] = cached.split('|');
      if (Date.now() - Number(ts) < 7 * DAY_MS) return code;
    }
    const res = await fetch('https://ipwho.is/');
    if (!res.ok) throw new Error(String(res.status));
    const json: unknown = await res.json();
    const code =
      json && typeof json === 'object' && typeof (json as { country_code?: unknown }).country_code === 'string'
        ? (json as { country_code: string }).country_code
        : '??';
    localStorage.setItem(COUNTRY_KEY, `${Date.now()}|${code}`);
    return code;
  } catch {
    return '??';
  }
};

/** Logs one page view (a tool id, or "home"). Never throws. */
export const logVisit = (toolId: string): void => {
  if (!isSupabaseConfigured()) return;

  // Only log when the route actually changes — this dedupes Strict-Mode's
  // double effect runs and re-renders, while still counting real revisits.
  const token = `${today()}|${toolId}`;
  try {
    if (sessionStorage.getItem(LAST_VISIT_KEY) === token) return;
    sessionStorage.setItem(LAST_VISIT_KEY, token);
  } catch {
    /* no sessionStorage: just log */
  }

  void (async () => {
    try {
      const [visitor_hash, country] = await Promise.all([visitorHash(), getCountry()]);
      await fetch(`${SUPABASE_URL}/rest/v1/visits`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          day: today(),
          path: window.location.hash || '#home',
          tool_id: toolId,
          country,
          visitor_hash,
        }),
        keepalive: true,
      });
    } catch {
      /* best-effort only */
    }
  })();
};
