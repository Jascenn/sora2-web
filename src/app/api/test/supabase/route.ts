import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Supabase admin client not initialized',
        details: 'SUPABASE_SERVICE_ROLE_KEY is missing',
      }, { status: 500 })
    }

    // Test 1: Check if we can query the users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, credits')
      .limit(5)

    if (usersError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to query users table',
        details: usersError.message,
        code: usersError.code,
      }, { status: 500 })
    }

    // Test 2: Check if we can query system config
    const { data: config, error: configError } = await supabaseAdmin
      .from('system_config')
      .select('*')
      .limit(5)

    // Test 3: Get table information
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    return NextResponse.json({
      success: true,
      message: 'Supabase connection working',
      data: {
        users: {
          count: users?.length || 0,
          data: users || [],
          error: null,
        },
        config: {
          count: config?.length || 0,
          data: config || [],
          error: configError ? (configError as any).message : null,
        },
        tables: {
          available: tableInfo?.map((t: any) => t.table_name) || [],
          error: tableError ? (tableError as any).message : null,
        },
      },
      env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      },
    })
  } catch (error: any) {
    console.error('Supabase test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
