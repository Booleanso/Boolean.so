import { NextRequest, NextResponse } from 'next/server';
import { google, calendar_v3 } from 'googleapis';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const TIME_ZONE = process.env.GOOGLE_CALENDAR_TIME_ZONE || 'America/New_York';

function getCalendarClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const impersonated = process.env.GOOGLE_IMPERSONATED_USER;
  if (!clientEmail || !privateKey) throw new Error('Missing Google service account credentials');
  if (impersonated) {
    const auth = new google.auth.JWT({ email: clientEmail, key: privateKey, scopes: ['https://www.googleapis.com/auth/calendar.readonly'], subject: impersonated });
    return google.calendar({ version: 'v3', auth });
  }
  const auth = new google.auth.GoogleAuth({ credentials: { client_email: clientEmail, private_key: privateKey }, scopes: ['https://www.googleapis.com/auth/calendar.readonly'] });
  return google.calendar({ version: 'v3', auth });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });

    // In a production app, you would look up bookingId → eventId in your DB.
    // For now, try to find a recent matching event by searching summary contains bookingId.
    const calendar = getCalendarClient();
    const timeMin = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const events = await calendar.events.list({ calendarId: CALENDAR_ID, timeMin, timeMax, singleEvents: true, q: bookingId, orderBy: 'startTime' });
    const ev = (events.data.items || [])[0];
    if (!ev) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const start = ev.start?.dateTime || ev.start?.date;
    const dateObj = start ? new Date(start) : new Date();
    const dateString = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeString = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const meet = ev.conferenceData?.entryPoints?.find(p => p.entryPointType === 'video')?.uri || ev.hangoutLink || '';

    return NextResponse.json({
      bookingId,
      name: ev.attendees?.[0]?.displayName || 'Guest',
      email: ev.attendees?.[0]?.email || '',
      date: dateString,
      time: timeString,
      meetingLink: meet,
    });
  } catch (error) {
    console.error('lookup error', error);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}


