import { NextRequest, NextResponse } from 'next/server';

const BAGS_API_BASE = 'https://api.bags.fm';
const BAGS_API_KEY = process.env.BAGS_API_KEY_SERVER || process.env.NEXT_PUBLIC_BAGS_API_KEY || '';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60; // requests per window
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/**
 * Proxy requests to Bags.fm API
 * Protects API key server-side and handles CORS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { path } = await params;
  const pathStr = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BAGS_API_BASE}/${pathStr}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BAGS_API_KEY}`,
        'X-API-Key': BAGS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return NextResponse.json(
        { error: `Bags API error: ${response.status}`, details: errorBody },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Bags proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Bags API' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { path } = await params;
  const pathStr = path.join('/');
  const url = `${BAGS_API_BASE}/${pathStr}`;

  try {
    const contentType = request.headers.get('content-type') || '';
    let fetchOptions: RequestInit;

    if (contentType.includes('multipart/form-data')) {
      // Forward FormData (image uploads)
      const formData = await request.formData();
      fetchOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BAGS_API_KEY}`,
          'X-API-Key': BAGS_API_KEY,
        },
        body: formData,
      };
    } else {
      // JSON body
      const body = await request.json();
      fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BAGS_API_KEY}`,
          'X-API-Key': BAGS_API_KEY,
        },
        body: JSON.stringify(body),
      };
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return NextResponse.json(
        { error: `Bags API error: ${response.status}`, details: errorBody },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Bags proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Bags API' },
      { status: 500 }
    );
  }
}
