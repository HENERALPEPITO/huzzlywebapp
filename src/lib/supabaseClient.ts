import { createClient } from '@supabase/supabase-js';

// We fall back to NEXT_PUBLIC in case it's built with Next.js which requires it for client-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// If env vars are present, return the real client. Otherwise provide a noop client
// so the app can render without crashing during local development.
function createNoopClient() {
	const noop = {
		from: (_table: string) => ({
			select: (_s?: string) => ({
				order: async (_col?: string, _opts?: any) => ({ data: [], error: null }),
				eq: async (_k: string, _v: any) => ({ data: [], error: null }),
			}),
			insert: async (_payload: any) => ({ data: [], error: null }),
		}),
		channel: (_name: string) => ({
			on: (_event: string, _opts: any, _cb?: any) => ({
				subscribe: () => ({})
			})
		}),
		removeChannel: (_c: any) => {},
	} as any;

	return noop;
}

export const supabase = (supabaseUrl && supabaseAnonKey)
	? createClient(supabaseUrl, supabaseAnonKey)
	: (() => {
			console.warn('Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Using noop client.');
			return createNoopClient();
		})();
