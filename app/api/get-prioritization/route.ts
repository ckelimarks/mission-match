import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handshakeId = searchParams.get('handshakeId');

    if (!handshakeId) {
      return NextResponse.json(
        { error: 'handshakeId is required' },
        { status: 400 }
      );
    }

    console.log('[GET-PRIORITIZATION] Query params:', { handshakeId, supabaseUrl });
    console.log('[GET-PRIORITIZATION] Service key exists:', !!supabaseServiceKey);
    console.log('[GET-PRIORITIZATION] Service key length:', supabaseServiceKey?.length);

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      global: { headers: { 'Cache-Control': 'no-cache' } }
    });

    // First, test if we can query at all
    const { data: testCount, error: testError } = await supabase
      .from('prioritizations')
      .select('*', { count: 'exact', head: true });

    console.log('[GET-PRIORITIZATION] Test count query:', { count: testCount, error: testError });

    // Fetch all prioritizations for this handshake
    const { data: prioritizations, error } = await supabase
      .from('prioritizations')
      .select('*')
      .eq('handshake_id', handshakeId);

    console.log('[GET-PRIORITIZATION] Raw query result:', {
      prioritizations,
      error,
      handshakeId,
      resultCount: prioritizations?.length
    });

    if (error) {
      console.error('Failed to fetch prioritizations:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Get handshake to know who the parties are
    const { data: handshake, error: handshakeError } = await supabase
      .from('handshakes')
      .select('initiator_id, recipient_id')
      .eq('id', handshakeId)
      .single();

    if (handshakeError || !handshake) {
      return NextResponse.json(
        { error: 'Handshake not found' },
        { status: 404 }
      );
    }

    // Organize by profile
    const initiatorPrioritization = prioritizations?.find(
      p => p.profile_id === handshake.initiator_id
    );
    const recipientPrioritization = prioritizations?.find(
      p => p.profile_id === handshake.recipient_id
    );

    // Calculate alignment if both have answered
    let alignment = null;
    if (initiatorPrioritization && recipientPrioritization) {
      alignment = calculateAlignment(
        initiatorPrioritization.answers,
        recipientPrioritization.answers,
        initiatorPrioritization.method
      );
    }

    return NextResponse.json({
      initiator: initiatorPrioritization || null,
      recipient: recipientPrioritization || null,
      alignment,
      bothCompleted: !!(initiatorPrioritization && recipientPrioritization),
    });
  } catch (error) {
    console.error('Get prioritization error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get prioritization',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function calculateAlignment(answers1: any, answers2: any, method: string) {
  if (method === 'quick-pick') {
    // Quick Pick: Count exact matches
    const keys = Object.keys(answers1);
    const matches = keys.filter(key => answers1[key] === answers2[key]);

    return {
      matchedCount: matches.length,
      totalQuestions: keys.length,
      divergences: keys.filter(key => answers1[key] !== answers2[key]),
      summary: `Matched on ${matches.length}/${keys.length} priorities`,
    };
  } else if (method === 'point-allocation') {
    // Point Allocation: Calculate correlation and top priorities
    const allKeys = Array.from(new Set([...Object.keys(answers1), ...Object.keys(answers2)]));

    // Find top 3 priorities for each person
    const getTop3 = (answers: Record<string, number>) => {
      return Object.entries(answers)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([key]) => key);
    };

    const top1 = getTop3(answers1);
    const top2 = getTop3(answers2);
    const sharedTopPriorities = top1.filter(k => top2.includes(k));

    return {
      sharedTopPriorities: sharedTopPriorities.length,
      person1Top: top1,
      person2Top: top2,
      summary: `${sharedTopPriorities.length}/3 shared top priorities`,
    };
  }

  return null;
}
