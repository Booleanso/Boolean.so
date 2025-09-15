import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const CALENDAR_IDS = (process.env.GOOGLE_CALENDAR_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const TIME_ZONE = process.env.GOOGLE_CALENDAR_TIME_ZONE || 'America/New_York';

const BUSINESS_HOURS = { start: 9, end: 17, intervalMinutes: 15 } as const;

function getCalendarClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const impersonated = process.env.GOOGLE_IMPERSONATED_USER;

  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google service account credentials');
  }

  if (impersonated) {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      subject: impersonated,
    });
    return google.calendar({ version: 'v3', auth });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
  return google.calendar({ version: 'v3', auth });
}

type BusyInterval = { start: Date; end: Date };
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD
    if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 });

    const target = new Date(`${date}T00:00:00`);
    if (Number.isNaN(target.getTime())) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });

    // Allow all days

    const now = new Date();
    const bufferFrom = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const calendar = getCalendarClient();
    const startOfDay = new Date(target);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(target);
    endOfDay.setHours(23, 59, 59, 999);

    const items = (CALENDAR_IDS.length > 0 ? CALENDAR_IDS : [CALENDAR_ID]).map(id => ({ id }));
    const fb = await calendar.freebusy.query({
      requestBody: {
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        items,
        timeZone: TIME_ZONE,
      },
    });

    const busy: BusyInterval[] = Object.values(fb.data.calendars || {})
      .flatMap((cal: any) => (cal?.busy || []) as Array<{ start?: string; end?: string }>)
      .map(b => ({ start: new Date(b.start || ''), end: new Date(b.end || '') }))
      .filter(b => !isNaN(b.start.getTime()) && !isNaN(b.end.getTime()));

    const slots: Array<{ time: string; startIso: string; endIso: string; available: boolean }> = [];

    for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
      for (let minute = 0; minute < 60; minute += BUSINESS_HOURS.intervalMinutes) {
        const start = new Date(target);
        start.setHours(hour, minute, 0, 0);
        const end = new Date(start.getTime() + BUSINESS_HOURS.intervalMinutes * 60 * 1000);

        // honor 24h buffer
        if (start < bufferFrom) continue;

        const isBusy = busy.some(b => overlaps(start, end, b.start, b.end));
        if (!isBusy) {
          const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          slots.push({ time: timeStr, startIso: start.toISOString(), endIso: end.toISOString(), available: true });
        }
      }
    }

    return NextResponse.json({ date, slots });
  } catch (error) {
    console.error('day-availability error', error);
    return NextResponse.json({ error: 'Failed to compute day availability' }, { status: 500 });
  }
}


