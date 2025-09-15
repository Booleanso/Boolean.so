import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const CALENDAR_IDS = (process.env.GOOGLE_CALENDAR_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const TIME_ZONE = process.env.GOOGLE_CALENDAR_TIME_ZONE || 'America/New_York';

const BUSINESS_HOURS = { start: 9, end: 17, intervalMinutes: 15 } as const;
const SEARCH_WINDOW_DAYS = 30; // look up to 30 days out

function getCalendarClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const impersonated = process.env.GOOGLE_IMPERSONATED_USER;

  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google service account credentials');
  }

  // If an impersonated user is provided (Workspace domain-wide delegation), use JWT with subject
  if (impersonated) {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      subject: impersonated,
    });
    return google.calendar({ version: 'v3', auth });
  }

  // Fallback: direct service account auth (works only on SA-owned calendars)
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

export async function GET() {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Calendar credentials not configured' }, { status: 500 });
    }

    const calendar = getCalendarClient();

    const now = new Date();
    const startFrom = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h buffer
    const searchUntil = new Date(startFrom.getTime() + SEARCH_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const items = (CALENDAR_IDS.length > 0 ? CALENDAR_IDS : [CALENDAR_ID]).map(id => ({ id }));

    const freebusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: startFrom.toISOString(),
        timeMax: searchUntil.toISOString(),
        items,
        timeZone: TIME_ZONE,
      },
    });

    const calendarsMap = freebusy.data.calendars || {};
    const busy: BusyInterval[] = Object.values(calendarsMap)
      .flatMap((cal: any) => (cal?.busy || []) as Array<{ start?: string; end?: string }>)
      .map(b => ({ start: new Date(b.start || ''), end: new Date(b.end || '') }))
      .filter(b => !isNaN(b.start.getTime()) && !isNaN(b.end.getTime()));

    // iterate dates
    for (let d = new Date(startFrom); d <= searchUntil; d.setDate(d.getDate() + 1)) {
      // now allow all days

      for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
        for (let minute = 0; minute < 60; minute += BUSINESS_HOURS.intervalMinutes) {
          const start = new Date(d);
          start.setHours(hour, minute, 0, 0);

          if (start < startFrom) continue; // respect 24h buffer on first day

          const end = new Date(start.getTime() + BUSINESS_HOURS.intervalMinutes * 60 * 1000);

          const isBusy = busy.some(b => overlaps(start, end, b.start, b.end));
          if (!isBusy) {
            const time = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            const date = start.toISOString().slice(0, 10);
            return NextResponse.json({
              date,
              time,
              startIso: start.toISOString(),
              endIso: end.toISOString(),
              timeZone: TIME_ZONE,
            });
          }
        }
      }
    }

    return NextResponse.json({ error: 'No available slots in the next 30 days' }, { status: 404 });
  } catch (error) {
    console.error('Earliest slot error:', error);
    return NextResponse.json({ error: 'Failed to compute earliest slot' }, { status: 500 });
  }
}


