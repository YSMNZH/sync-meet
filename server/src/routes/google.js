import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getGoogleAuthUrl,
  handleGoogleOAuthCallback,
  syncMeetingToGoogle,
  syncGoogleEventsToDb
} from '../services/google.js';
import { prisma } from '../prisma.js';

const router = Router();

router.get('/status', requireAuth, async (req, res) => {
  try {
    const credential = await prisma.googleCredential.findUnique({
      where: { ownerEmail: req.user.email },
    });
    const isConnected = !!credential && !!credential.accessToken;
    res.json({ isConnected });
  } catch (error) {
    // console.error('Error checking Google connection status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

router.get('/auth', requireAuth, (req, res) => {
  try {
    // console.log('=== GOOGLE AUTH DEBUG ===');
    // console.log('User Email:', req.user.email);
    // console.log('Environment:', process.env.NODE_ENV);
    const authorizationUrl = getGoogleAuthUrl(req.user.email);
    // console.log('Generated Auth URL:', authorizationUrl);
    // console.log('========================');
    res.redirect(authorizationUrl);
  } catch (err) {
    // console.error("Error generating Google Auth URL:", err);
    res.status(500).send("Could not initiate Google Authentication.");
  }
});

router.get('/auth/callback', async (req, res) => {  try {
    const { code, state } = req.query;
    const userEmail = String(state);
    // console.log(`[AUTH_CALLBACK] Received callback for user: ${userEmail}`);

    await handleGoogleOAuthCallback(String(code), userEmail);
    // console.log(`[AUTH_CALLBACK] Google OAuth tokens handled successfully for ${userEmail}`);

    try {
      // console.log(`🔄 [SYNC 1/2] Starting sync from DB to Google Calendar for ${userEmail}`);
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (user) {
        const unsyncedMeetings = await prisma.meeting.findMany({
          where: {
            organizerId: user.id,            googleEventId: null,
          },
          orderBy: { startTime: 'asc' }
        });
        // console.log(`  [SYNC 1/2] Found ${unsyncedMeetings.length} local meetings to sync to Google.`);
        for (const meeting of unsyncedMeetings) {
          await syncMeetingToGoogle(meeting.id, user.id, userEmail);
        }
        // console.log(`  [SYNC 1/2] Finished syncing local meetings.`);
      } else {
        // console.error(`  [SYNC 1/2] User ${userEmail} not found in DB. Skipping this sync step.`);
      }
    } catch (dbToGoogleSyncError) {
      // console.error(`💥 [SYNC 1/2 FATAL] Sync from DB to Google failed:`, dbToGoogleSyncError.message);
    }

    try {
      // console.log(`🔄 [SYNC 2/2] Starting sync from Google Calendar to DB for ${userEmail}`);
      await syncGoogleEventsToDb(userEmail);
      // console.log(`  [SYNC 2/2] Finished syncing Google events.`);
    } catch (googleToDbSyncError) {
      // console.error(`💥 [SYNC 2/2 FATAL] Sync from Google to DB failed:`, googleToDbSyncError.message);
    }

    // console.log(`[AUTH_CALLBACK] All sync operations completed for ${userEmail}. Redirecting...`);
    res.redirect(`${process.env.FRONTEND_URL}/google?success=true`);
  } catch (err) {
    // console.error('[AUTH_CALLBACK_ERROR] Critical error during Google OAuth callback:', err.message);
    res.redirect(`${process.env.FRONTEND_URL}/google?success=false&error=${encodeURIComponent(err.message)}`);
  }
});

router.post('/sync/:meetingId', requireAuth, async (req, res) => {
  try {    const { meetingId } = req.params;
    const { id: userId, email: userEmail } = req.user;
    const event = await syncMeetingToGoogle(meetingId, userId, userEmail);
    res.json({ message: 'Meeting synced successfully', event });
  } catch (err) {
    // console.error(err);
    res.status(500).json({ error: err.message || 'Sync failed' });
  }
});

export default router;