import { Router } from 'express'
import { getAuthUrl, handleOAuthCallback, syncMeetingToGoogle } from '../services/google.js'

const router = Router()

router.get('/auth/start', (req, res) => {
  const ownerEmail = String(req.query.ownerEmail || '')
  if (!ownerEmail) return res.status(400).json({ error: 'ownerEmail required' })
  const url = getAuthUrl(ownerEmail)
  res.json({ url })
})

router.get('/auth/callback', async (req, res) => {
  try {
    const code = String(req.query.code || '')
    const state = String(req.query.state || '')
    const ownerEmail = await handleOAuthCallback(code, state)
    res.send('Google authorization successful. You can close this window and return to the app.')
  } catch (err) {
    console.error(err)
    res.status(500).send('Google authorization failed')
  }
})

router.post('/sync/:meetingId', async (req, res) => {
  try {
    const ownerEmail = String(req.query.ownerEmail || '')
    if (!ownerEmail) return res.status(400).json({ error: 'ownerEmail required' })
    const meetingId = req.params.meetingId
    const event = await syncMeetingToGoogle({ meetingId, ownerEmail })
    res.json({ ok: true, event })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || 'Sync failed' })
  }
})

export default router