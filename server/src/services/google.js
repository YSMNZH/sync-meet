import { google } from 'googleapis';
import { prisma } from '../prisma.js';

function makeOAuthClient() {  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export const getGoogleAuthUrl = (ownerEmail) => {
  if (!ownerEmail) throw new Error('Owner email is required');

  const oauth2Client = makeOAuthClient();
  const scopes = ['https://www.googleapis.com/auth/calendar'];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: ownerEmail,
  });
};

export const handleGoogleOAuthCallback = async (code, state) => {
  const ownerEmail = state;
  if (!ownerEmail) throw new Error('Missing ownerEmail in state');

  const oauth2Client = makeOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  const credentialData = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    scope: tokens.scope,
    tokenType: tokens.token_type,
    expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
  };

  await prisma.googleCredential.upsert({
    where: { ownerEmail },
    update: { ...credentialData },
    create: { ownerEmail, ...credentialData },
  });

  return ownerEmail;
};

async function getAuthedCalendarClient(ownerEmail) {
  const cred = await prisma.googleCredential.findUnique({ where: { ownerEmail } });
  if (!cred) throw new Error('No Google credentials found for this user.');

  const oauth2Client = makeOAuthClient();
  oauth2Client.setCredentials({
    access_token: cred.accessToken,
    refresh_token: cred.refreshToken,
    scope: cred.scope,
    token_type: cred.tokenType,
    expiry_date: cred.expiryDate ? Number(cred.expiryDate) : null,
  });

  oauth2Client.on('tokens', async (tokens) => {
    console.log('Google tokens refreshed for user:', ownerEmail);
    const updateData = {
      accessToken: tokens.access_token,
      expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
    };
    if (tokens.refresh_token) {
      updateData.refreshToken = tokens.refresh_token;
    }
    await prisma.googleCredential.update({ where: { ownerEmail }, data: updateData });
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function syncMeetingToGoogle(meetingId, organizerId, organizerEmail) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { invitations: true },
  });
  if (!meeting) throw new Error('Meeting not found');
  if (meeting.organizerId !== organizerId) throw new Error('Only the organizer can sync the meeting');

  const calendar = await getAuthedCalendarClient(organizerEmail);

  const event = {
    summary: meeting.title,
    description: meeting.description || '',
    start: { dateTime: new Date(meeting.startTime).toISOString() },
    end: { dateTime: new Date(meeting.endTime).toISOString() },
    attendees: meeting.invitations.map(inv => ({ email: inv.email })),
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: meeting.reminderMinutesBefore || 30 }],
    },
  };

  try {
    let result;
    if (meeting.googleEventId) {
      result = await calendar.events.update({        
        calendarId: 'primary',
        eventId: meeting.googleEventId,
        requestBody: event,
        sendNotifications: true,
      });
    } else {
      result = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendNotifications: true,
      });      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { googleEventId: result.data.id, organizerEmail: organizerEmail },
      });
    }
    return result.data;
  } catch (err) {
    const errorDetails = err?.response?.data?.error?.message || err.message;
    throw new Error(`Google Calendar Error: ${errorDetails}`);
  }
}

/**
 * Fetches events from the user's primary Google Calendar.
 * @param {string} userEmail - The email of the user whose calendar we want to fetch.
 * @returns {Promise<Array>} A promise that resolves to an array of Google Calendar event objects.
 */
export async function getGoogleCalendarEvents(userEmail) {
  console.log(`[G_CAL_FETCH] Attempting to fetch calendar events for ${userEmail}`);
  
  const oauth2Client = await getOauthClient(userEmail);
  if (!oauth2Client) {
    throw new Error(`Google credentials not found for user ${userEmail}. Cannot fetch events.`);
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(), // Fetch events from the last month
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;
    if (!events || events.length === 0) {
      console.log(`[G_CAL_FETCH] No upcoming events found for ${userEmail}.`);
      return [];
    }
    
    console.log(`[G_CAL_FETCH] Successfully fetched ${events.length} events for ${userEmail}.`);
    return events;  } catch (error) {
    console.error(`[G_CAL_FETCH_ERROR] Error fetching calendar events for ${userEmail}:`, error.message);
    
    if (error.response?.status === 401) {
      console.error("[G_CAL_FETCH_ERROR] Token might be expired or revoked.");
    }
    throw new Error('Failed to fetch Google Calendar events.');  }
}

export async function syncGoogleEventsToDb(userEmail) {
  console.log(`[DB_SYNC_START] Starting sync from Google Calendar to DB for ${userEmail}`);

  // 1. Fetch user from DB to get their ID
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });
  if (!user) {
    console.error(`[DB_SYNC_ERROR] User ${userEmail} not found in our database.`);
    return;
  }

  // 2. Fetch events from Google Calendar  const googleEvents = await getGoogleCalendarEvents(userEmail);
  if (!googleEvents || googleEvents.length === 0) {
    console.log(`[DB_SYNC_INFO] No events from Google Calendar to sync.`);
    return;
  }
  
  // 3. Get all existing googleEventIds from our DB for this user  
  const existingMeetingIds = await prisma.meeting.findMany({
    where: { 
      organizerId: user.id,
      googleEventId: { not: null }
    },
    select: { googleEventId: true },
  });
  const existingGoogleEventIds = new Set(existingMeetingIds.map(m => m.googleEventId));
  console.log(`[DB_SYNC_INFO] Found ${existingGoogleEventIds.size} existing meetings with Google Event IDs.`);

  // 4. Filter out events that are already in our DB
  const newEventsToCreate = googleEvents.filter(event => 
    event.id && !existingGoogleEventIds.has(event.id) && event.status !== 'cancelled'
  );

  console.log(`[DB_SYNC_INFO] Found ${newEventsToCreate.length} new events from Google to create in our DB.`);

  if (newEventsToCreate.length === 0) {
    console.log(`[DB_SYNC_COMPLETE] Database is already up-to-date with Google Calendar.`);
    return;
  }

  // 5. Create new meetings in our database
  let createdCount = 0;
  for (const event of newEventsToCreate) {
    try {
      // Basic validation for required fields
      if (!event.summary || !event.start?.dateTime || !event.end?.dateTime) {
        console.warn(`[DB_SYNC_WARN] Skipping event with missing data: ${event.id}`);
        continue;
      }

      await prisma.meeting.create({
        data: {
          title: event.summary,
          description: event.description || '',
          startTime: new Date(event.start.dateTime),
          endTime: new Date(event.end.dateTime),
          organizerId: user.id,
          organizerEmail: user.email,
          googleEventId: event.id, // Very important: store the Google Event ID
          archived: new Date(event.end.dateTime) < new Date(),
        },
      });
      createdCount++;
      console.log(`   ✅ Created meeting in DB for Google event: "${event.summary}"`);
    } catch (error) {
      console.error(`   ❌ Failed to create meeting for Google event "${event.summary}" (ID: ${event.id}):`, error.message);
    }
  }

  console.log(`[DB_SYNC_COMPLETE] Successfully created ${createdCount}/${newEventsToCreate.length} new meetings from Google Calendar.`);
}