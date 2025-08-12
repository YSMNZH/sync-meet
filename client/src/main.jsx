import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './pages/App.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import CreateMeetingPage from './pages/CreateMeetingPage.jsx'
import InvitationRespondPage from './pages/InvitationRespondPage.jsx'
import ArchivesPage from './pages/ArchivesPage.jsx'
import GoogleConnect from './pages/GoogleConnect.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import './index.css'

import axios from 'axios'
const savedToken = localStorage.getItem('token')
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <CalendarPage /> },
      { path: 'create', element: <CreateMeetingPage /> },
      { path: 'invite', element: <InvitationRespondPage /> },
      { path: 'archives', element: <ArchivesPage /> },
      { path: 'google', element: <GoogleConnect /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
