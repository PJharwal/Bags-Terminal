import { NextRequest, NextResponse } from 'next/server';

const BAGS_API_BASE = 'https://api.bags.fm';
const BAGS_PUBLIC_API_BASE = 'https://public-api-v2.bags.fm/api/v1';
const BAGS_API_KEY = process.env.BAGS_API_KEY_SERVER || '';
if (!BAGS_API_KEY) { console.error('BAGS_API_KEY_SERVER is not configured'); }

// Routes that should use the public API v2
const PUBLIC_API_ROUTES = [
  'token-launch/lifetime-fees',
  'token-launch/creator/v3',
  'token-launch/claim-stats',
  'token-launch/create-token-info',
  'fee-share/token/claim-events',
  'fee-share/wallet/v2',
  'partner/config',
  'partner/claimable',
  'partner/claim',
];

function getApiBase(path: string): string {
  if (PUBLIC_API_ROUTES.some(route => path.startsWith(route))) {
    return BAGS_PUBLIC_API_BASE;
  }
  return BAGS_API_BASE;
}

// Simple in-memory rate limiter with periodic cleanup
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60; // requests per window
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up every 5 minutes

// Periodic cleanup of expired entries to prevent memory leaks
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}

function checkRateLimit(ip: string): boolean {
  cleanupExpiredEntries();
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
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  const xReal = request.headers.get('x-real-ip');
  if (xReal) return xReal;
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
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
  const apiBase = getApiBase(pathStr);
  const url = `${apiBase}/${pathStr}${searchParams ? `?${searchParams}` : ''}`;

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
  const apiBase = getApiBase(pathStr);
  const url = `${apiBase}/${pathStr}`;

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
