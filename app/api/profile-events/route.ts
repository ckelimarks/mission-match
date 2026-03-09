import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';

/**
 * SSE endpoint for profile-level events (connections list changes).
 *
 * Replaces 5-second polling on /profile and /connections pages.
 * Watches all handshakes where profileId is initiator or recipient.
 *
 * Events:
 *   - connections_changed: handshake count, consent states, or statuses changed
 *
 * Query params:
 *   - profileId: required
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');

  if (!profileId) {
    return new Response(JSON.stringify({ error: 'profileId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // Build initial snapshot for change detection
  let lastSnapshot = await getConnectionsSnapshot(supabase, profileId);

  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ profileId })}\n\n`));

      const pollInterval = setInterval(async () => {
        if (cancelled) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const currentSnapshot = await getConnectionsSnapshot(supabase, profileId);

          if (currentSnapshot !== lastSnapshot) {
            lastSnapshot = currentSnapshot;
            controller.enqueue(encoder.encode(
              `event: connections_changed\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`
            ));
          }

          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch (err) {
          console.error('[PROFILE-SSE] Poll error:', err);
        }
      }, 3000);

      request.signal.addEventListener('abort', () => {
        cancelled = true;
        clearInterval(pollInterval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

/**
 * Build a compact fingerprint of all handshakes for a profile.
 * Change in this string = something the UI cares about changed.
 */
async function getConnectionsSnapshot(supabase: any, profileId: string): Promise<string> {
  const { data } = await supabase
    .from('handshakes')
    .select('id, status, initiator_id, recipient_id, initiator_consented, recipient_consented, updated_at')
    .or(`initiator_id.eq.${profileId},recipient_id.eq.${profileId}`)
    .order('created_at', { ascending: false });

  if (!data || data.length === 0) return '[]';

  // Hash-like fingerprint: count + concatenated consent/status values
  return data.map((h: any) =>
    `${h.id}:${h.status}:${h.initiator_consented}:${h.recipient_consented}:${h.updated_at}`
  ).join('|');
}
