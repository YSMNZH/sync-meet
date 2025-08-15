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

<img width="1886" height="865" alt="image" src="https://github.com/user-attachments/assets/34cda443-8f69-4bd6-9b69-6d33bc9d6196" />

<br><br>

<img width="1882" height="705" alt="image" src="https://github.com/user-attachments/assets/55a7f75f-e87e-495f-90c8-15fc4e3b8e0e" />

<br><br>

<img width="1881" height="739" alt="image" src="https://github.com/user-attachments/assets/72f88114-c8c8-4c4c-99b4-460244866b0d" />

<br><br>

<img width="1900" height="810" alt="image" src="https://github.com/user-attachments/assets/6e77a625-9137-4d8e-aeac-228d73c23334" />

<br><br>

<img width="1867" height="685" alt="image" src="https://github.com/user-attachments/assets/d19b305f-8afb-4694-81f6-ab5562f34b4c" />

<br><br>

<img width="1488" height="671" alt="image" src="https://github.com/user-attachments/assets/42292f8f-fc3b-4ebb-9e4c-3eb10041b308" />





