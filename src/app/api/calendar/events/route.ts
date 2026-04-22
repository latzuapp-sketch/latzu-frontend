/**
 * /api/calendar/events
 *
 * GET  — list events from the user's primary Google Calendar
 * POST — create a new event in the user's primary Google Calendar
 *
 * All calls are server-side, using the access token stored in the
 * NextAuth JWT session. No Google SDK needed — plain fetch to REST API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function noCalendarResponse() {
  return NextResponse.json(
    { connected: false, error: 'CALENDAR_NOT_CONNECTED' },
    { status: 200 } // 200 so the frontend can read the body
  );
}

function unauthorizedResponse() {
  return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
}

// ─── GET /api/calendar/events ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const timeMin =
    searchParams.get('timeMin') ??
    new Date(Date.now() - 86_400_000).toISOString(); // yesterday
  const timeMax =
    searchParams.get('timeMax') ??
    new Date(Date.now() + 14 * 86_400_000).toISOString(); // +14 days

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });

  const res = await fetch(
    `${GCAL_BASE}/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      next: { revalidate: 60 }, // cache 60s
    }
  );

  if (res.status === 401 || res.status === 403) return noCalendarResponse();
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { connected: false, error: err?.error?.message ?? 'GCAL_ERROR' },
      { status: 200 }
    );
  }

  const data = await res.json();

  // Normalise to a simpler shape for the frontend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = (data.items ?? []).map((item: any) => ({
    id: item.id,
    title: item.summary ?? '(sin título)',
    start: item.start?.dateTime ?? item.start?.date,
    end: item.end?.dateTime ?? item.end?.date,
    allDay: !item.start?.dateTime,
    htmlLink: item.htmlLink,
    description: item.description ?? null,
    colorId: item.colorId ?? null,
  }));

  return NextResponse.json({ connected: true, events });
}

// ─── POST /api/calendar/events ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return unauthorizedResponse();

  const body = await req.json().catch(() => null);
  if (!body?.summary) {
    return NextResponse.json({ error: 'MISSING_SUMMARY' }, { status: 400 });
  }

  const event = {
    summary: body.summary,
    description: body.description ?? '',
    start: body.allDay
      ? { date: body.start }
      : { dateTime: body.start, timeZone: body.timeZone ?? 'UTC' },
    end: body.allDay
      ? { date: body.end ?? body.start }
      : { dateTime: body.end ?? body.start, timeZone: body.timeZone ?? 'UTC' },
    ...(body.colorId ? { colorId: body.colorId } : {}),
  };

  const res = await fetch(`${GCAL_BASE}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (res.status === 401 || res.status === 403) return noCalendarResponse();
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: err?.error?.message ?? 'GCAL_CREATE_ERROR' },
      { status: 200 }
    );
  }

  const created = await res.json();
  return NextResponse.json({
    connected: true,
    event: {
      id: created.id,
      title: created.summary,
      start: created.start?.dateTime ?? created.start?.date,
      end: created.end?.dateTime ?? created.end?.date,
      allDay: !created.start?.dateTime,
      htmlLink: created.htmlLink,
    },
  });
}
