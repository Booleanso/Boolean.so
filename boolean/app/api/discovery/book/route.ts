import { NextRequest, NextResponse } from 'next/server';
import { google, calendar_v3 } from 'googleapis';

interface BookingRequest {
  name: string;
  phone: string;
  selectedDate?: string; // legacy support
  selectedTime?: string; // legacy support
  startIso?: string;     // preferred
  endIso?: string;       // preferred
  projectDetails?: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  targetAudience?: string;
  keyFeatures?: string;
  inspiration?: string;
  businessGoals?: string;
}

// Google Calendar configuration
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const TIME_ZONE = process.env.GOOGLE_CALENDAR_TIME_ZONE || 'America/New_York';

// Initialize Google Calendar client
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
      scopes: ['https://www.googleapis.com/auth/calendar'],
      subject: impersonated,
    });
    return google.calendar({ version: 'v3', auth });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
}

// Convert legacy date/time to ISO window if needed
function legacyToIso(selectedDate?: string, selectedTime?: string) {
  if (!selectedDate || !selectedTime) return { startIso: undefined, endIso: undefined };
  const [time, modifier] = selectedTime.split(' ');
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (modifier?.toLowerCase() === 'pm' && h !== 12) h += 12;
  if (modifier?.toLowerCase() === 'am' && h === 12) h = 0;
  const start = new Date(`${selectedDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

// Create calendar event
async function createCalendarEvent(calendar: calendar_v3.Calendar, bookingData: BookingRequest) {
  const { 
    name, 
    selectedDate, 
    selectedTime, 
    startIso: startIsoIn, 
    endIso: endIsoIn, 
    projectDetails,
    projectType,
    budget,
    timeline,
    targetAudience,
    keyFeatures,
    inspiration,
    businessGoals
  } = bookingData;
  
  // Prefer ISO inputs; fallback to legacy date/time
  const legacyIso = legacyToIso(selectedDate, selectedTime);
  const startDateTime = new Date(startIsoIn || legacyIso.startIso!);
  const endDateTime = new Date(endIsoIn || legacyIso.endIso!);
  
  // Create comprehensive meeting description with all project details
  const description = `
Discovery Call with ${name}

Contact Information:
- Phone: ${bookingData.phone}

PROJECT OVERVIEW:
${projectDetails || 'No specific details provided'}

PROJECT DETAILS:
- Project Type: ${projectType || 'Not specified'}
- Budget Range: ${budget || 'Not specified'}
- Timeline: ${timeline || 'Not specified'}
- Target Audience: ${targetAudience || 'Not specified'}

KEY FEATURES NEEDED:
${keyFeatures || 'Not specified'}

INSPIRATION/REFERENCES:
${inspiration || 'Not specified'}

BUSINESS GOALS:
${businessGoals || 'Not specified'}

MEETING AGENDA:
- Discuss project requirements and goals
- Review technical specifications and features
- Understand target audience and user needs
- Determine project scope and development approach
- Review timeline and budget considerations
- Provide initial recommendations and next steps
- Q&A session

PREPARATION NOTES:
- Client has provided comprehensive project details above
- Review similar projects in our portfolio
- Prepare technical questions based on project type
- Have cost estimation framework ready
- Prepare timeline discussion based on client needs

Please review all project details above before the call and prepare relevant questions and recommendations.
  `.trim();

  const event = {
    summary: `Discovery Call - ${name}`,
    description,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: TIME_ZONE,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: TIME_ZONE,
    },
    attendees: [],
    conferenceData: {
      createRequest: {
        requestId: `discovery-${Date.now()}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'email', minutes: 60 },      // 1 hour before
        { method: 'popup', minutes: 10 },      // 10 minutes before
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all', // Send email invitations to attendees
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error('Failed to create calendar event');
  }
}

export async function POST(request: NextRequest) {
  try {
    const bookingData: BookingRequest = await request.json();
    
    // Validate required fields
    if (!bookingData.name || !bookingData.phone || !(bookingData.startIso || (bookingData.selectedDate && bookingData.selectedTime))) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if required environment variables are set
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      console.error('Missing Google Calendar credentials');
      return NextResponse.json(
        { error: 'Calendar service temporarily unavailable' },
        { status: 500 }
      );
    }

    // Initialize Google Calendar client
    const calendar = getCalendarClient();
    
    // Create the calendar event
    const calendarEvent = await createCalendarEvent(calendar, bookingData);
    
    // Generate booking ID
    const bookingId = `DISC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Log the booking for tracking
    console.log('Discovery call booked:', {
      bookingId,
      name: bookingData.name,
      phone: bookingData.phone,
      date: bookingData.selectedDate,
      time: bookingData.selectedTime,
      eventId: calendarEvent.id,
      meetingLink: calendarEvent.conferenceData?.entryPoints?.[0]?.uri,
    });

    // Return success response with booking details
    return NextResponse.json({
      success: true,
      bookingId,
      eventId: calendarEvent.id,
      meetingLink: calendarEvent.conferenceData?.entryPoints?.[0]?.uri,
      message: 'Discovery call booked successfully!',
    });

  } catch (error) {
    console.error('Error booking discovery call:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to book discovery call',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 