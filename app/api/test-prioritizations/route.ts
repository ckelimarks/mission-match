import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test 1: Query ALL prioritizations (no filter)
    const { data: allData, error: allError } = await supabase
      .from('prioritizations')
      .select('*');

    // Test 2: Query with handshake_id filter
    const { data: filteredData, error: filteredError } = await supabase
      .from('prioritizations')
      .select('*')
      .eq('handshake_id', '183ae29d-4d58-471a-b5a6-9a1121d39361');

    // Test 3: Query handshakes table to verify connection works
    const { data: handshakeData, error: handshakeError } = await supabase
      .from('handshakes')
      .select('*')
      .eq('id', '183ae29d-4d58-471a-b5a6-9a1121d39361')
      .single();

    return NextResponse.json({
      test1_all_prioritizations: {
        count: allData?.length,
        data: allData,
        error: allError
      },
      test2_filtered_prioritizations: {
        count: filteredData?.length,
        data: filteredData,
        error: filteredError
      },
      test3_handshake: {
        data: handshakeData,
        error: handshakeError
      },
      env_check: {
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: supabaseUrl
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
