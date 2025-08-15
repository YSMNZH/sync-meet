# SyncMeet - Group Calendar and Meeting Management

- Backend: Node.js, Express, MongoDB
- Frontend: React (Vite)
- Email: Nodemailer configured to send via Gmail SMTP
- Accessing Google Calendar via OAuth (googleapis)

## Features
- Create meetings (title, description, start/end, color, reminder)
- Invite users; track responses (attend / not attend)
- Monthly and weekly calendar views with color-coded events
- Email reminders before meetings
- Archives of past meetings
- Google Calendar sync

## Getting Started (Local)

1. Backend
cd server
cp .env .env.local
npm i
npx prisma db push
npx prisma generate
npm run dev
Server runs at http://localhost:4000

3. Frontend
cd client
npm i
npm run dev
App runs at http://localhost:5173

## Screenshots

<img width="1920" height="854" alt="image" src="https://github.com/user-attachments/assets/31b1c6bb-c55c-4f52-a4d5-7e24f7b57898" />

<br><br>

<img width="1920" height="878" alt="image" src="https://github.com/user-attachments/assets/4365a14b-2c4b-4511-b1ec-663200d96492" />

<br><br>

<img width="1917" height="779" alt="image" src="https://github.com/user-attachments/assets/975b0228-ef36-41c5-8ad7-db4c664d6814" />

<br><br>

<img width="1915" height="837" alt="image" src="https://github.com/user-attachments/assets/ab7f0872-08ef-4636-b792-849ee8a9889c" />

<br><br>

<img width="1900" height="810" alt="image" src="https://github.com/user-attachments/assets/6e77a625-9137-4d8e-aeac-228d73c23334" />

<br><br>

<img width="1912" height="895" alt="image" src="https://github.com/user-attachments/assets/6ce30a19-0240-41e7-80ac-bd6633cebb60" />

<br><br>

<img width="1507" height="559" alt="image" src="https://github.com/user-attachments/assets/1faae8bc-1a45-4ef4-9281-ab9a6b282029" />





