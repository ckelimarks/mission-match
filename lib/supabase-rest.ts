/**
 * Supabase REST API helper with caching disabled
 *
 * Vercel aggressively caches fetch() calls. This helper ensures all
 * Supabase REST requests bypass caching completely.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface SupabaseRestOptions {
  table: string;
  select?: string;
  filters?: string; // e.g., "status=eq.pending&user_id=eq.123"
  order?: string;   // e.g., "created_at.desc"
  limit?: number;
}

/**
 * Fetch from Supabase REST API with caching completely disabled
 */
export async function supabaseRest<T = unknown>(options: SupabaseRestOptions): Promise<{ data: T[] | null; error: Error | null }> {
  const { table, select = '*', filters, order, limit } = options;

  let url = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}`;

  if (filters) {
    url += `&${filters}`;
  }
  if (order) {
    url += `&order=${encodeURIComponent(order)}`;
  }
  if (limit) {
    url += `&limit=${limit}`;
  }

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      next: { revalidate: 0 },
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { data: null, error: new Error(`Supabase REST error: ${response.status} - ${errorBody}`) };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Raw fetch with no-cache headers for custom queries
 */
export async function supabaseRestRaw(path: string): Promise<Response> {
  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    cache: 'no-store',
    next: { revalidate: 0 },
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  });
}
