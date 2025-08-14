# SyncMeet - Group Calendar and Meeting Management

- Backend: Node.js, Express, MongoDB
- Frontend: React (Vite), react-big-calendar
- Email: Nodemailer (works with MailHog or MailDev)
- Accessing Google Calendar via OAuth (googleapis)

## Features
- Create meetings (title, description, start/end, color, reminder)
- Invite users by email; track responses (attend / not attend)
- Monthly and weekly calendar views with color-coded events
- Email reminders before meetings
- Archives of past meetings
- Optional: Google Calendar sync (two-way insert/update from SyncMeet)

## Getting Started (Local)

1. Backend
```
cd server
cp .env .env.local || true
npm i
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
Server runs at http://localhost:4000

2. Frontend
```
cd client
npm i
npm run dev
```
App runs at http://localhost:5173

3. Email (optional for local)
- Start MailHog: `docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog`
- Update `SMTP_*` in `server/.env` if needed.

## Google Calendar (Optional Bonus)
- Set these in `server/.env`:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:4000/api/google/auth/callback
```
- In the app, open Google page (nav -> Google), enter your email, and authorize.
- To sync a meeting: call `POST /api/google/sync/:meetingId?ownerEmail=you@example.com`.

## API Highlights
- POST `/api/meetings` create meeting and optional invitations
- GET `/api/meetings?start=ISO&end=ISO` list for calendar
- GET `/api/meetings/:id` detail (includes invitations)
- PATCH `/api/meetings/:id` update
- POST `/api/meetings/:id/archive` archive
- GET `/api/meetings/archives/list` archives
- GET `/api/invitations/:token` get invitation
- POST `/api/invitations/respond` accept/decline
- GET `/api/google/auth/start?ownerEmail=` begin Google OAuth
- GET `/api/google/auth/callback` OAuth redirect URI
- POST `/api/google/sync/:meetingId?ownerEmail=` sync meeting to Google

## Docker (Optional)

Build and run with Docker Compose:
```
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Database: SQLite file persisted in `server/prisma/dev.db`

## Screenshots
- See `/docs/screenshots` (add your own during development).