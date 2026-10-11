/**
 * Visit + share tracker.
 *
 * Privacy design:
 *   • no cookies, no personal profiles
 *   • each browser gets ONE random ID that identifies nothing but itself;
 *     only a salted SHA-256 of it ever leaves the device
 *   • the visitor IP (for security/abuse stats) comes from a single
 *     per-session lookup (ipwho.is) and is stored with the visit row —
 *     keep retention short (see the optional purge job in the README)
 *   • tracking is best-effort: failures are swallowed, the app never breaks
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '../config/admin';

const VID_KEY = 'tz_vid';
const GEO_KEY = 'tz_geo';
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

type Geo = { ip: string; country: string };

/**
 * Visitor IP + country, fetched once per browser session (cached in
 * sessionStorage) so route changes don't hammer the geo service.
 */
const getGeo = async (): Promise<Geo> => {
  try {
    const cached = sessionStorage.getItem(GEO_KEY);
    if (cached) return JSON.parse(cached) as Geo;
  } catch {
    /* ignore */
  }
  const geo: Geo = { ip: 'unknown', country: '??' };
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const json: unknown = await res.json();
      if (json && typeof json === 'object') {
        const { ip, country_code } = json as { ip?: unknown; country_code?: unknown };
        if (typeof ip === 'string') geo.ip = ip;
        if (typeof country_code === 'string') geo.country = country_code;
      }
    }
  } catch {
    /* offline / blocked — fall back to unknown */
  }
  try {
    sessionStorage.setItem(GEO_KEY, JSON.stringify(geo));
  } catch {
    /* ignore */
  }
  return geo;
};

/** POSTs one row to Supabase REST. Fire-and-forget, never throws. */
const insertRow = (table: 'visits' | 'shares', row: Record<string, unknown>): void => {
  if (!isSupabaseConfigured()) return;
  void (async () => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(row),
        keepalive: true,
      });
    } catch {
      /* best-effort only */
    }
  })();
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
      const [visitor_hash, geo] = await Promise.all([visitorHash(), getGeo()]);
      insertRow('visits', {
        day: today(),
        path: window.location.hash || '#home',
        tool_id: toolId,
        country: geo.country,
        ip: geo.ip,
        visitor_hash,
      });
    } catch {
      /* best-effort only */
    }
  })();
};

/**
 * Logs one share click (which tool, which channel, from the tool screen
 * or from a home card). Never throws.
 */
export const logShare = (
  toolId: string,
  channel: string,
  origin: 'tool' | 'card'
): void => {
  if (!isSupabaseConfigured()) return;
  void (async () => {
    try {
      const geo = await getGeo();
      insertRow('shares', {
        day: today(),
        tool_id: toolId,
        channel,
        origin,
        country: geo.country,
        ip: geo.ip,
      });
    } catch {
      /* best-effort only */
    }
  })();
};
