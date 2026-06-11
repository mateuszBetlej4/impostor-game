import { createClient } from '@supabase/supabase-js';

// Temporary testing fallback for the Vercel preview build.
// Prefer Vercel environment variables for production/public release.
const fallbackSupabaseUrl = 'https://pzjfnhliwbylcwokdxme.supabase.co';
const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6amZuaGxpd2J5bGN3b2tkeG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExOTY4NzUsImV4cCI6MjA5Njc3Mjg3NX0.ZO7xEPLepbOqRLz2AFas0PJF34jqf46P1P14VIzBNgg';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;
