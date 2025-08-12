import { google } from 'googleapis'
import { prisma } from '../prisma.js'

function makeOAuth() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export function getAuthUrl(ownerEmail) {
  const oauth2Client = makeOAuth()
  const scopes = ['https://www.googleapis.com/auth/calendar']
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',     
    scope: scopes,
    prompt: 'consent',        
    state: encodeURIComponent(ownerEmail),
  })
  return url
}

export async function handleOAuthCallback(code, state) {
  const ownerEmail = decodeURIComponent(state || '')
  if (!ownerEmail) throw new Error('Missing ownerEmail in state')

  const oauth2Client = makeOAuth()
  const { tokens } = await oauth2Client.getToken(code)

  const existing = await prisma.googleCredential.findUnique({ where: { ownerEmail } })

  const updateData = {
    accessToken: tokens.access_token || existing?.accessToken || '',
    scope: tokens.scope || existing?.scope || null,
    tokenType: tokens.token_type || existing?.tokenType || null,
    expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : existing?.expiryDate || null,
  }
  if (tokens.refresh_token) updateData.refreshToken = tokens.refresh_token

  if (existing) {
    await prisma.googleCredential.update({ where: { ownerEmail }, data: updateData })
  } else {
    await prisma.googleCredential.create({
      data: {
        ownerEmail,
        accessToken: updateData.accessToken,
        refreshToken: updateData.refreshToken || '',
        scope: updateData.scope,
        tokenType: updateData.tokenType,
        expiryDate: updateData.expiryDate,
      }
    })
  }
  return ownerEmail
}

async function getAuthedCalendar(ownerEmail) {
  const cred = await prisma.googleCredential.findUnique({ where: { ownerEmail } })
  if (!cred) throw new Error('No Google credentials for owner')

  const oauth2Client = makeOAuth()
  oauth2Client.setCredentials({
    access_token: cred.accessToken || undefined,
    refresh_token: cred.refreshToken || undefined,
    scope: cred.scope || undefined,
    token_type: cred.tokenType || undefined,
    expiry_date: cred.expiryDate ? Number(cred.expiryDate) : undefined,
  })

  oauth2Client.on('tokens', async (tokens) => {
    const data = {}
    if (tokens.refresh_token) data.refreshToken = tokens.refresh_token
    if (tokens.access_token) data.accessToken = tokens.access_token
    if (tokens.expiry_date) data.expiryDate = BigInt(tokens.expiry_date)
    if (Object.keys(data).length) {
      try {
        await prisma.googleCredential.update({ where: { ownerEmail }, data })
      } catch (err) {
        console.error('Failed to persist google tokens', err)
      }
    }
  })

  try { await oauth2Client.getAccessToken() } catch (err) { console.warn('getAccessToken failed (may be ok):', err.message) }

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function syncMeetingToGoogle({ meetingId, ownerEmail }) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } })
  if (!meeting) throw new Error('Meeting not found')
  const calendar = await getAuthedCalendar(ownerEmail)

  const event = {
    summary: meeting.title,
    description: meeting.description || '',
    start: { dateTime: new Date(meeting.startTime).toISOString() },
    end: { dateTime: new Date(meeting.endTime).toISOString() },
  }

  let result
  try {
    if (meeting.googleEventId) {
      result = await calendar.events.update({ calendarId: 'primary', eventId: meeting.googleEventId, requestBody: event })
    } else {
      result = await calendar.events.insert({ calendarId: 'primary', requestBody: event })
      await prisma.meeting.update({ where: { id: meeting.id }, data: { googleEventId: result.data.id, organizerEmail: ownerEmail } })
    }
    return result.data
  } catch (err) {
    console.error('Google sync error:', err?.response?.data || err.message || err)
    throw err
  }
}
