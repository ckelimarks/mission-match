import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';

/**
 * SSE endpoint for real-time handshake updates.
 *
 * Events:
 *   - analysis_complete: analysis_status changed to completed/failed
 *   - consent_update: initiator_consented or recipient_consented changed
 *   - handshake_update: any state change on the handshake
 *
 * Query params:
 *   - handshakeId: required
 *   - requesterId: required (privacy check — must be participant)
 *
 * Falls back gracefully: client uses EventSource with auto-reconnect,
 * and degrades to 10s polling if SSE fails entirely.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const handshakeId = searchParams.get('handshakeId');
  const requesterId = searchParams.get('requesterId');

  if (!handshakeId) {
    return new Response(JSON.stringify({ error: 'handshakeId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // Verify handshake exists and requester is a participant
  const { data: handshake, error } = await supabase
    .from('handshakes')
    .select('id, initiator_id, recipient_id, initiator_consented, recipient_consented, status')
    .eq('id', handshakeId)
    .maybeSingle();

  if (error || !handshake) {
    return new Response(JSON.stringify({ error: 'Handshake not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (requesterId) {
    const isParticipant = handshake.initiator_id === requesterId || handshake.recipient_id === requesterId;
    if (!isParticipant) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Get initial analysis state for change detection
  const { data: initialAnalysis } = await supabase
    .from('analyses')
    .select('id, analysis_status')
    .eq('handshake_id', handshakeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let lastAnalysisStatus = initialAnalysis?.analysis_status || 'pending';
  let lastInitiatorConsented = handshake.initiator_consented;
  let lastRecipientConsented = handshake.recipient_consented;
  let lastHandshakeStatus = handshake.status;

  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ handshakeId })}\n\n`));

      // Poll Supabase for changes every 2 seconds (server-side polling, client sees SSE push)
      // This is more efficient than client polling because:
      // 1. Single connection instead of repeated HTTP requests
      // 2. Only sends data on actual changes
      // 3. Server-side polling interval can be tuned without client changes
      const pollInterval = setInterval(async () => {
        if (cancelled) {
          clearInterval(pollInterval);
          return;
        }

        try {
          // Fetch current handshake state
          const { data: currentHandshake } = await supabase
            .from('handshakes')
            .select('initiator_consented, recipient_consented, status')
            .eq('id', handshakeId)
            .maybeSingle();

          // Fetch current analysis state
          const { data: currentAnalysis } = await supabase
            .from('analyses')
            .select('id, analysis_status')
            .eq('handshake_id', handshakeId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!currentHandshake) return;

          // Check for analysis status change
          const analysisStatus = currentAnalysis?.analysis_status || 'pending';
          if (analysisStatus !== lastAnalysisStatus) {
            lastAnalysisStatus = analysisStatus;
            if (analysisStatus === 'completed' || analysisStatus === 'failed') {
              controller.enqueue(encoder.encode(
                `event: analysis_complete\ndata: ${JSON.stringify({ status: analysisStatus, analysisId: currentAnalysis?.id })}\n\n`
              ));
            }
          }

          // Check for consent changes
          if (
            currentHandshake.initiator_consented !== lastInitiatorConsented ||
            currentHandshake.recipient_consented !== lastRecipientConsented
          ) {
            lastInitiatorConsented = currentHandshake.initiator_consented;
            lastRecipientConsented = currentHandshake.recipient_consented;
            controller.enqueue(encoder.encode(
              `event: consent_update\ndata: ${JSON.stringify({
                initiator_consented: currentHandshake.initiator_consented,
                recipient_consented: currentHandshake.recipient_consented,
              })}\n\n`
            ));
          }

          // Check for general status change
          if (currentHandshake.status !== lastHandshakeStatus) {
            lastHandshakeStatus = currentHandshake.status;
            controller.enqueue(encoder.encode(
              `event: handshake_update\ndata: ${JSON.stringify({ status: currentHandshake.status })}\n\n`
            ));
          }

          // Keepalive comment (prevents proxy timeouts)
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch (err) {
          console.error('[SSE] Poll error:', err);
          // Don't kill the stream on transient errors
        }
      }, 2000);

      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        cancelled = true;
        clearInterval(pollInterval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
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
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
