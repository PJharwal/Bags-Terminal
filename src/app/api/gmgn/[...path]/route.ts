import { NextRequest, NextResponse } from 'next/server';

const GMGN_LOCAL = process.env.GMGN_LOCAL_URL || 'http://localhost:8000';
const GMGN_PUBLIC = 'https://gmgn.ai/api/v1/sol';

const GMGN_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW = 60000;
const CLEANUP_INTERVAL = 5 * 60 * 1000;

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

async function fetchWithFallback(pathStr: string, searchParams: string) {
  const localUrl = `${GMGN_LOCAL}/${pathStr}${searchParams ? `?${searchParams}` : ''}`;
  const publicUrl = `${GMGN_PUBLIC}/${pathStr}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const localRes = await fetch(localUrl, {
      headers: GMGN_HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (localRes.ok) {
      return await localRes.json();
    }
  } catch {
    // Local server unavailable — try public API
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const publicRes = await fetch(publicUrl, {
      headers: GMGN_HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (publicRes.ok) {
      return await publicRes.json();
    }
  } catch {
    // Public API also failed
  }

  return null;
}

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

  try {
    const data = await fetchWithFallback(pathStr, searchParams);

    if (data) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'GMGN API unavailable' },
      { status: 502 }
    );
  } catch (error) {
    console.error('GMGN proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from GMGN server' },
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
  const url = `${GMGN_LOCAL}/${pathStr}`;

  try {
    const body = await request.json();
    const response = await fetch(url, {
      method: 'POST',
      headers: GMGN_HEADERS,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `GMGN API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GMGN proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from GMGN server' },
      { status: 500 }
    );
  }
}
