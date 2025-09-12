import { NextRequest, NextResponse } from 'next/server';
import { google, calendar_v3 } from 'googleapis';

interface BookingRequest {
  name: string;
  email: string;
  selectedDate: string;
  selectedTime: string;
  projectDetails: string;
  projectType: string;
  budget: string;
  timeline: string;
  targetAudience: string;
  keyFeatures: string;
  inspiration: string;
  businessGoals: string;
}

// Google Calendar configuration
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const TIME_ZONE = 'America/New_York'; // Adjust to your timezone

// Initialize Google Calendar client
function getCalendarClient() {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

// Convert time string to 24-hour format
function convertTo24Hour(timeStr: string): string {
  const [time, modifier] = timeStr.split(' ');
  const [hoursStr, minutes] = time.split(':');
  let hours = hoursStr;
  
  if (hours === '12') {
    hours = '00';
  }
  
  if (modifier.toLowerCase() === 'pm') {
    hours = (parseInt(hours, 10) + 12).toString();
  }
  
  return `${hours.padStart(2, '0')}:${minutes}`;
}

// Create calendar event
async function createCalendarEvent(calendar: calendar_v3.Calendar, bookingData: BookingRequest) {
  const { 
    name, 
    email, 
    selectedDate, 
    selectedTime, 
    projectDetails,
    projectType,
    budget,
    timeline,
    targetAudience,
    keyFeatures,
    inspiration,
    businessGoals
  } = bookingData;
  
  // Convert date and time to ISO format
  const timeIn24Hour = convertTo24Hour(selectedTime);
  const startDateTime = new Date(`${selectedDate}T${timeIn24Hour}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 minutes later
  
  // Create comprehensive meeting description with all project details
  const description = `
Discovery Call with ${name}

Contact Information:
- Email: ${email}

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
    attendees: [
      { email: email },
    ],
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
      resource: event,
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
    if (!bookingData.name || !bookingData.email || !bookingData.selectedDate || !bookingData.selectedTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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
      email: bookingData.email,
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