/**
 * Supabase connection for the visit tracker + private admin dashboard.
 *
 * These two values are PUBLIC by design — they ship inside every website
 * bundle (that is how Supabase works). Security comes from the database
 * policies, not from hiding them:
 *   • anonymous visitors can only INSERT one visit row (never read anything)
 *   • data can only be READ by a signed-in admin (you), via Supabase Auth
 *
 * TO CONNECT YOUR OWN PROJECT (free, ~5 minutes):
 *   1. Create a project at https://supabase.com
 *   2. In the SQL Editor, run the setup script from the project README
 *   3. Authentication → Users → "Add user" (your admin email + password),
 *      then turn OFF "Allow new users to sign up" (Email provider settings)
 *   4. Paste your Project URL and anon/public key below
 */
export const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';

export const isSupabaseConfigured = (): boolean =>
  !SUPABASE_URL.includes('YOUR-PROJECT') && !SUPABASE_ANON_KEY.includes('YOUR-ANON');
