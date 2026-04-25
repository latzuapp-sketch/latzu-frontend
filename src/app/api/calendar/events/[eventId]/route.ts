/**
 * /api/calendar/events/[eventId]
 *
 * PATCH  — update an existing Google Calendar event
 * DELETE — delete a Google Calendar event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3';

function noCalendarResponse() {
  return NextResponse.json({ connected: false, error: 'CALENDAR_NOT_CONNECTED' }, { status: 200 });
}

function unauthorizedResponse() {
  return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
}

// ─── PATCH /api/calendar/events/[eventId] ─────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return unauthorizedResponse();

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'MISSING_BODY' }, { status: 400 });

  // Fetch the existing event first so we can do a partial update
  const existing = await fetch(
    `${GCAL_BASE}/calendars/primary/events/${params.eventId}`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } },
  );

  if (existing.status === 401 || existing.status === 403) return noCalendarResponse();
  if (!existing.ok) {
    return NextResponse.json({ connected: true, error: 'EVENT_NOT_FOUND' }, { status: 200 });
  }

  const current = await existing.json();

  // Merge changes — only the fields the caller wants to touch
  const patch: Record<string, unknown> = {};

  if (body.summary !== undefined) patch.summary = body.summary;
  if (body.description !== undefined) patch.description = body.description;

  if (body.start !== undefined) {
    patch.start = body.allDay
      ? { date: body.start }
      : { dateTime: body.start, timeZone: body.timeZone ?? current.start?.timeZone ?? 'UTC' };
  }
  if (body.end !== undefined) {
    patch.end = body.allDay
      ? { date: body.end ?? body.start }
      : { dateTime: body.end, timeZone: body.timeZone ?? current.end?.timeZone ?? 'UTC' };
  }

  const res = await fetch(
    `${GCAL_BASE}/calendars/primary/events/${params.eventId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    },
  );

  if (res.status === 401 || res.status === 403) return noCalendarResponse();
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { connected: true, error: err?.error?.message ?? 'GCAL_PATCH_ERROR' },
      { status: 200 },
    );
  }

  const updated = await res.json();
  return NextResponse.json({
    connected: true,
    event: {
      id: updated.id,
      title: updated.summary,
      start: updated.start?.dateTime ?? updated.start?.date,
      end: updated.end?.dateTime ?? updated.end?.date,
      allDay: !updated.start?.dateTime,
      htmlLink: updated.htmlLink,
    },
  });
}

// ─── DELETE /api/calendar/events/[eventId] ────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { eventId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return unauthorizedResponse();

  const res = await fetch(
    `${GCAL_BASE}/calendars/primary/events/${params.eventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.accessToken}` },
    },
  );

  if (res.status === 401 || res.status === 403) return noCalendarResponse();
  // 404 means already deleted — treat as success
  if (!res.ok && res.status !== 404) {
    return NextResponse.json({ connected: true, error: 'GCAL_DELETE_ERROR' }, { status: 200 });
  }

  return NextResponse.json({ connected: true, deleted: true });
}
