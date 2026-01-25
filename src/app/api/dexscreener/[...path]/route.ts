import { NextRequest, NextResponse } from 'next/server';

const DEXSCREENER_BASE = 'https://api.dexscreener.com';

/**
 * Proxy requests to DexScreener API
 * This handles CORS issues when the client-side fetch fails
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${DEXSCREENER_BASE}/${pathStr}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `DexScreener API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('DexScreener proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from DexScreener' },
      { status: 500 }
    );
  }
}
