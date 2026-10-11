import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import {
  BarChart3,
  Globe2,
  Lock,
  LogOut,
  MousePointerClick,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '../../config/admin';
import { TOOLS } from '../../constants/tools';
import { useApp } from '../../context/AppContext';

const DAY_MS = 86_400_000;
const DAYS = 30;

type VisitRow = {
  day: string;
  tool_id: string | null;
  country: string | null;
  visitor_hash: string | null;
};

const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const isoDay = (offsetDays = 0): string =>
  new Date(Date.now() - offsetDays * DAY_MS).toISOString().slice(0, 10);

/** 🇫🇷 style flag from a two-letter country code (no dependency). */
const flagOf = (code: string): string => {
  if (!/^[A-Za-z]{2}$/.test(code)) return '🌍';
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: string;
}> = ({ icon, label, value, tone }) => (
  <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-card p-4 sm:p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl grid place-items-center ${tone}`}>{icon}</div>
    <div className="min-w-0">
      <div className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
        {value.toLocaleString('en-US')}
      </div>
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">{label}</div>
    </div>
  </div>
);

const BarList: React.FC<{ title: string; rows: Array<{ key: string; label: string; count: number }> }> = ({
  title,
  rows,
}) => {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-card p-5 sm:p-6">
      <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">No data yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">{r.label}</span>
                <span className="font-black text-gray-900 dark:text-white tabular-nums ms-2">{r.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500"
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */
const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setBusy(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-10 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-raised p-7 sm:p-8">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ink-800 to-indigo-600 text-white grid place-items-center mx-auto mb-4 shadow-lg shadow-indigo-600/25">
        <Lock className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-black text-gray-900 dark:text-white text-center">Admin sign in</h1>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1 mb-6">
        Visitor statistics for Toolzy
      </p>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field w-full"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field w-full"
        />
        {error && (
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
        )}
        <button type="submit" disabled={busy} className="btn btn-primary w-full py-2.5 text-sm">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */
const Dashboard: React.FC<{ session: Session }> = ({ session }) => {
  const { t } = useApp();
  const [rows, setRows] = useState<VisitRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const collected: VisitRow[] = [];
    for (let page = 0; page < 20; page++) {
      const { data, error: err } = await supabase
        .from('visits')
        .select('day, tool_id, country, visitor_hash')
        .gte('day', isoDay(DAYS))
        .order('day', { ascending: true })
        .range(page * 1000, page * 1000 + 999);
      if (err) {
        setError(err.message);
        break;
      }
      collected.push(...((data ?? []) as VisitRow[]));
      if (!data || data.length < 1000) break;
    }
    setRows(collected);
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  const stats = useMemo(() => {
    if (!rows) return null;
    const perDay = new Map<string, { visits: number; uniq: Set<string> }>();
    const tools = new Map<string, number>();
    const countries = new Map<string, number>();
    const uniqAll = new Set<string>();

    for (const r of rows) {
      const d = perDay.get(r.day) ?? { visits: 0, uniq: new Set<string>() };
      d.visits += 1;
      if (r.visitor_hash) {
        d.uniq.add(r.visitor_hash);
        uniqAll.add(r.visitor_hash);
      }
      perDay.set(r.day, d);

      const tool = r.tool_id ?? 'home';
      tools.set(tool, (tools.get(tool) ?? 0) + 1);

      const cc = r.country ?? '??';
      countries.set(cc, (countries.get(cc) ?? 0) + 1);
    }

    const series = Array.from({ length: DAYS + 1 }, (_, i) => {
      const day = isoDay(DAYS - i);
      const v = perDay.get(day);
      return { day, visits: v?.visits ?? 0, uniq: v?.uniq.size ?? 0 };
    });

    const toolLabel = (id: string): string => {
      if (id === 'home') return t('nav.home');
      const tool = TOOLS.find((x) => x.id === id);
      return tool ? t(tool.titleKey) : id;
    };

    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    const countryLabel = (cc: string): string => {
      if (cc === '??') return 'Unknown';
      try {
        return regionNames.of(cc.toUpperCase()) ?? cc;
      } catch {
        return cc;
      }
    };

    const toList = (m: Map<string, number>, label: (k: string) => string, key: (k: string) => string) =>
      Array.from(m, ([k, count]) => ({ key: key(k), label: label(k), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    return {
      total: rows.length,
      unique: uniqAll.size,
      today: perDay.get(isoDay())?.visits ?? 0,
      week: series.slice(-7).reduce((s, d) => s + d.visits, 0),
      series,
      toolRows: toList(tools, toolLabel, (k) => k),
      countryRows: toList(countries, countryLabel, (k) => k),
      maxDay: Math.max(1, ...series.map((d) => d.visits)),
    };
  }, [rows, t]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Admin</p>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Visitor statistics
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Last {DAYS + 1} days · signed in as {session.user.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void load()} className="btn btn-secondary px-3 py-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => void supabase?.auth.signOut()}
            className="btn btn-secondary px-3 py-2 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
      )}

      {!stats ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-16 text-center text-sm text-gray-400">
          Loading statistics…
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<MousePointerClick className="w-5 h-5" />}
              label="Total visits"
              value={stats.total}
              tone="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
            />
            <StatCard
              icon={<ShieldCheck className="w-5 h-5" />}
              label="Unique visitors"
              value={stats.unique}
              tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Visits today"
              value={stats.today}
              tone="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
            <StatCard
              icon={<Globe2 className="w-5 h-5" />}
              label="Last 7 days"
              value={stats.week}
              tone="bg-sky-500/10 text-sky-600 dark:text-sky-400"
            />
          </div>

          {/* Visits-per-day chart */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-card p-5 sm:p-6">
            <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4">
              Visits per day
            </h3>
            <div className="flex items-end gap-[3px] h-40">
              {stats.series.map((d) => (
                <div
                  key={d.day}
                  title={`${d.day} — ${d.visits} visits, ${d.uniq} visitors`}
                  className="flex-1 rounded-t bg-gradient-to-t from-indigo-600 to-violet-500 hover:opacity-80 transition-opacity"
                  style={{
                    height: d.visits
                      ? `${Math.max(6, (d.visits / stats.maxDay) * 100)}%`
                      : '2%',
                    opacity: d.visits ? 1 : 0.25,
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-2">
              <span>{stats.series[0].day}</span>
              <span>{stats.series[stats.series.length - 1].day}</span>
            </div>
          </div>

          {/* Tools + countries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BarList title="Most used tools" rows={stats.toolRows} />
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-card p-5 sm:p-6">
              <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4">Countries</h3>
              {stats.countryRows.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">No data yet.</p>
              ) : (
                <ul className="space-y-3">
                  {(() => {
                    const max = Math.max(1, ...stats.countryRows.map((x) => x.count));
                    return stats.countryRows.map((r) => (
                      <li key={r.key}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                            <span className="me-1.5">{flagOf(r.key)}</span>
                            {r.label}
                          </span>
                          <span className="font-black text-gray-900 dark:text-white tabular-nums ms-2">
                            {r.count}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600"
                            style={{ width: `${(r.count / max) * 100}%` }}
                          />
                        </div>
                      </li>
                    ));
                  })()}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */
export const AdminPanel: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setReady(true));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <div className="max-w-xl mx-auto mt-10 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-raised p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-black text-gray-900 dark:text-white">Not connected yet</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Create a free Supabase project, run the setup SQL, then paste your
          Project URL and anon key into{' '}
          <code className="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
            src/config/admin.ts
          </code>
          . Full steps are in the README.
        </p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">Loading…</div>
    );
  }

  return session ? <Dashboard session={session} /> : <LoginForm />;
};

export default AdminPanel;
